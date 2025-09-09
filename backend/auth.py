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

    # Prepare robust fields from Kinde
    given = (kinde_user.get("given_name") or kinde_user.get("first_name") or "").strip()
    family = (kinde_user.get("family_name") or kinde_user.get("last_name") or "").strip()
    full_claim_name = (kinde_user.get("name") or "").strip()
    username = (kinde_user.get("username") or "").strip()
    token_name = (given + (" " + family if family else "")).strip() or full_claim_name or username or "User"

    token_phone = kinde_user.get("phone_number")

    # Email: prefer email/preferred_email; else construct unique placeholder from Kinde ID
    token_email = (kinde_user.get("email") or kinde_user.get("preferred_email") or "").strip()
    if not token_email:
        kid = (kinde_user.get("id") or "anon").strip()
        base = username if username else kid
        # guaranteed-unique placeholder (per tenant) using Kinde ID
        token_email = f"{base}@noemail.kinde"

    if not user:
        # Create new user from Kinde data (with robust fallbacks)
        user = User(
            kinde_id=kinde_user["id"],
            email=token_email,
            name=token_name,
            phone=token_phone
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Kinde leading: sync DB with token claims if different
        updated = False
        if token_name and token_name != (user.name or "").strip():
            user.name = token_name
            updated = True
        if token_phone and token_phone != (user.phone or ""):
            user.phone = token_phone
            updated = True
        # If our stored email is empty/placeholder and we get a better one, update it
        if token_email and token_email != (user.email or "").strip():
            # only update if existing email looks like placeholder or empty
            if not user.email or user.email.endswith("@noemail.kinde"):
                user.email = token_email
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
