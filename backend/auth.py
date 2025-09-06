import os
import requests
from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from database import get_db
from models import User
from dotenv import load_dotenv

load_dotenv()

security = HTTPBearer()

KINDE_DOMAIN = os.getenv("KINDE_DOMAIN")
KINDE_CLIENT_ID = os.getenv("KINDE_CLIENT_ID")
KINDE_CLIENT_SECRET = os.getenv("KINDE_CLIENT_SECRET")

def verify_kinde_token(token: str) -> dict:
    """Verify Kinde JWT token and return user info"""
    try:
        # Get Kinde public keys for token verification
        jwks_url = f"{KINDE_DOMAIN}/.well-known/jwks"
        
        # For now, we'll use Kinde's user info endpoint to verify token
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{KINDE_DOMAIN}/oauth2/user_profile", headers=headers)
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        
        return response.json()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token verification failed"
        )

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Get current authenticated user"""
    token = credentials.credentials
    kinde_user = verify_kinde_token(token)
    
    # Get or create user in our database
    user = db.query(User).filter(User.kinde_id == kinde_user["id"]).first()
    
    if not user:
        # Create new user from Kinde data
        user = User(
            kinde_id=kinde_user["id"],
            email=kinde_user.get("email", ""),
            name=kinde_user.get("given_name", "") + " " + kinde_user.get("family_name", ""),
            phone=kinde_user.get("phone_number")
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    
    return user

def get_optional_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User | None:
    """Get current user if authenticated, None otherwise"""
    try:
        return get_current_user(credentials, db)
    except HTTPException:
        return None
