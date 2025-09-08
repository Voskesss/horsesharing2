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
    # Debug: laat zien welke velden Kinde teruggeeft (eenmalig nuttig bij integratie)
    try:
        print(f"Kinde user keys: {list(kinde_user.keys())}")
    except Exception:
        pass
    
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
    else:
        # Kinde leading: sync DB with token claims if different
        # Fallbacks: sommige tenants gebruiken first_name/last_name i.p.v. given_name/family_name
        given = (kinde_user.get("given_name") or kinde_user.get("first_name") or "").strip()
        family = (kinde_user.get("family_name") or kinde_user.get("last_name") or "").strip()
        if not given and not family:
            # laatste redmiddel: splits volledige naam
            full = (kinde_user.get("name") or "").strip()
            if full:
                parts = full.split(" ", 1)
                given = parts[0]
                family = parts[1] if len(parts) > 1 else ""
        token_name = (given + (" " + family if family else "")).strip()
        token_phone = kinde_user.get("phone_number")

        updated = False
        if token_name and token_name != (user.name or "").strip():
            user.name = token_name
            updated = True
        if token_phone and token_phone != (user.phone or ""):
            user.phone = token_phone
            updated = True
        if updated:
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
