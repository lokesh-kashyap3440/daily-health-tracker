from datetime import datetime, timedelta, timezone
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.exceptions import (
    ConflictException,
    NotFoundException,
    UnauthorizedException,
)
from app.core.redis import RedisClient
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
    hash_password,
    verify_password,
)
from app.models.user import RefreshToken, User, UserProfile


class AuthService:
    def __init__(self, db: AsyncSession, redis: RedisClient):
        self.db = db
        self.redis = redis

    async def register(
        self,
        email: str,
        password: str,
        first_name: str,
        last_name: str | None = None,
    ) -> User:
        # Check if email already exists
        result = await self.db.execute(select(User).where(User.email == email))
        existing = result.scalars().first()
        if existing:
            raise ConflictException(f"Email '{email}' is already registered")

        # Create user
        user = User(
            id=uuid4(),
            email=email,
            password_hash=hash_password(password),
            first_name=first_name,
            last_name=last_name,
        )
        self.db.add(user)
        await self.db.flush()

        # Create empty profile
        profile = UserProfile(
            user_id=user.id,
        )
        self.db.add(profile)
        await self.db.flush()

        await self.db.refresh(user)
        return user

    async def login(self, email: str, password: str) -> dict:
        # Look up user
        result = await self.db.execute(select(User).where(User.email == email))
        user = result.scalars().first()

        if user is None:
            raise UnauthorizedException("Invalid email or password")

        if not user.is_active:
            raise UnauthorizedException("Account is disabled")

        # Verify password
        if not verify_password(password, user.password_hash):
            raise UnauthorizedException("Invalid email or password")

        # Generate tokens
        access_token = create_access_token(
            user_id=str(user.id),
            email=user.email,
            role=user.role,
        )

        refresh_token_str, jti = create_refresh_token(user_id=str(user.id))

        # Store refresh token in DB
        expires_at = datetime.now(timezone.utc) + timedelta(
            days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS
        )
        refresh_token = RefreshToken(
            user_id=user.id,
            jti=jti,
            expires_at=expires_at,
        )
        self.db.add(refresh_token)
        await self.db.flush()

        # Cache user profile
        await self.redis.set_json(
            f"user:{user.id}:profile",
            {
                "id": str(user.id),
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "role": user.role,
            },
            ttl=3600,
        )

        return {
            "access_token": access_token,
            "refresh_token": refresh_token_str,
            "token_type": "bearer",
            "expires_in": settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            "user": {
                "id": user.id,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
            },
        }

    async def refresh_access_token(self, refresh_token_str: str) -> dict:
        # Decode the refresh token
        payload = decode_refresh_token(refresh_token_str)
        if payload is None:
            raise UnauthorizedException("Invalid or expired refresh token")

        jti = payload.get("jti")
        user_id = payload.get("sub")

        if not jti or not user_id:
            raise UnauthorizedException("Invalid token payload")

        # Check if token exists and is not revoked
        result = await self.db.execute(
            select(RefreshToken).where(
                RefreshToken.jti == jti,
                RefreshToken.is_revoked == False,
            )
        )
        stored_token = result.scalars().first()

        if stored_token is None:
            raise UnauthorizedException("Refresh token has been revoked")

        # Check expiry
        if stored_token.expires_at < datetime.now(timezone.utc):
            stored_token.is_revoked = True
            await self.db.flush()
            raise UnauthorizedException("Refresh token has expired")

        # Revoke old token
        stored_token.is_revoked = True

        # Get user
        result = await self.db.execute(select(User).where(User.id == user_id))
        user = result.scalars().first()
        if user is None:
            raise UnauthorizedException("User not found")

        # Generate new tokens
        access_token = create_access_token(
            user_id=str(user.id),
            email=user.email,
            role=user.role,
        )

        new_refresh_token_str, new_jti = create_refresh_token(
            user_id=str(user.id)
        )

        new_expires_at = datetime.now(timezone.utc) + timedelta(
            days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS
        )
        new_refresh_token = RefreshToken(
            user_id=user.id,
            jti=new_jti,
            expires_at=new_expires_at,
        )
        self.db.add(new_refresh_token)
        await self.db.flush()

        return {
            "access_token": access_token,
            "refresh_token": new_refresh_token_str,
            "token_type": "bearer",
            "expires_in": settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        }

    async def logout(self, user_id: str, refresh_token_str: str) -> None:
        payload = decode_refresh_token(refresh_token_str)
        if payload is None:
            raise UnauthorizedException("Invalid refresh token")

        jti = payload.get("jti")
        if jti:
            result = await self.db.execute(
                select(RefreshToken).where(
                    RefreshToken.jti == jti,
                    RefreshToken.user_id == user_id,
                )
            )
            stored = result.scalars().first()
            if stored:
                stored.is_revoked = True
                await self.db.flush()

        # Invalidate user cache
        await self.redis.delete(f"user:{user_id}:profile")

    async def change_password(
        self, user_id: str, old_password: str, new_password: str
    ) -> None:
        result = await self.db.execute(select(User).where(User.id == user_id))
        user = result.scalars().first()
        if user is None:
            raise NotFoundException("User", user_id)

        if not verify_password(old_password, user.password_hash):
            raise UnauthorizedException("Current password is incorrect")

        user.password_hash = hash_password(new_password)

        # Revoke all refresh tokens
        result = await self.db.execute(
            select(RefreshToken).where(
                RefreshToken.user_id == user_id,
                RefreshToken.is_revoked == False,
            )
        )
        tokens = result.scalars().all()
        for token in tokens:
            token.is_revoked = True

        await self.db.flush()
        await self.redis.delete(f"user:{user_id}:profile")
