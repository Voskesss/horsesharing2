from fastapi import FastAPI, Depends, HTTPException, Request, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from fastapi.staticfiles import StaticFiles
import json
import os
import requests
from database import get_db
from models import User, RiderProfile, OwnerProfile, HorseProfile
from auth import get_current_user, get_optional_user
import uvicorn

app = FastAPI(title="HorseSharing API", version="1.0.0")

# Ensure uploads directory exists and mount static files
UPLOAD_ROOT = os.path.join(os.path.dirname(__file__), 'uploads')
os.makedirs(UPLOAD_ROOT, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_ROOT), name="uploads")

# CORS middleware voor frontend communicatie
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "HorseSharing API is running!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "horsesharing-api"}

@app.get("/auth/me")
async def get_me(request: Request, current_user: User = Depends(get_current_user)):
    """Get current authenticated user info"""
    # Probeer Kinde claims op te halen voor leading weergave
    kinde_claims = {}
    try:
        auth_header = request.headers.get("authorization") or request.headers.get("Authorization")
        if auth_header and auth_header.lower().startswith("bearer "):
            token = auth_header.split(" ", 1)[1]
            # Lazy import to avoid circular
            from auth import verify_kinde_token
            kinde_claims = verify_kinde_token(token) or {}
    except Exception:
        kinde_claims = {}

    # Haal mogelijke naamvelden uit claims
    given = (kinde_claims.get("given_name") or kinde_claims.get("first_name") or "").strip()
    family = (kinde_claims.get("family_name") or kinde_claims.get("last_name") or "").strip()
    full_claim_name = (given + (" " + family if family else "")).strip() or (kinde_claims.get("name") or "").strip()

    return {
        "id": current_user.id,
        "kinde_id": current_user.kinde_id,
        "email": current_user.email,
        "name": current_user.name,
        "phone": current_user.phone,
        # Extra: wat Kinde zelf zegt (leading)
        "kinde_given_name": given,
        "kinde_family_name": family,
        "kinde_full_name": full_claim_name,
        "onboarding_completed": current_user.onboarding_completed,
        "profile_type_chosen": current_user.profile_type_chosen,
        "has_rider_profile": current_user.rider_profile is not None,
        "has_owner_profile": current_user.owner_profile is not None,
        "created_at": current_user.created_at
    }


class ProfileTypeRequest(BaseModel):
    profile_type: str

@app.post("/auth/set-profile-type")
async def set_profile_type(
    request: ProfileTypeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Set profile type choice (rider/owner)"""
    current_user.profile_type_chosen = request.profile_type
    db.commit()
    db.refresh(current_user)
    
    return {"message": "Profile type set", "profile_type": request.profile_type}

@app.post("/auth/reset-profile")
async def reset_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Reset user profile - delete rider/owner profiles and reset onboarding"""
    # Delete rider profile if exists
    rider_profile = db.query(RiderProfile).filter(RiderProfile.user_id == current_user.id).first()
    if rider_profile:
        db.delete(rider_profile)
    
    # TODO: Delete owner profile when implemented
    # owner_profile = db.query(OwnerProfile).filter(OwnerProfile.user_id == current_user.id).first()
    # if owner_profile:
    #     db.delete(owner_profile)
    
    # Reset user onboarding status
    current_user.onboarding_completed = False
    current_user.profile_type_chosen = None
    
    db.commit()
    db.refresh(current_user)
    
    return {"message": "Profile reset successfully"}

@app.post("/auth/complete-onboarding")
async def complete_onboarding(
    profile_type: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark onboarding as completed and set profile type"""
    current_user.onboarding_completed = True
    current_user.profile_type_chosen = profile_type
    db.commit()
    db.refresh(current_user)
    
    return {"message": "Onboarding completed", "profile_type": profile_type}

# Pydantic models voor request/response
class RiderProfileCreate(BaseModel):
    # Basis informatie - allemaal optioneel voor tussentijds opslaan
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None
    postcode: Optional[str] = None
    house_number: Optional[str] = None
    city: Optional[str] = None
    max_travel_distance_km: Optional[int] = 25
    transport_options: List[str] = []
    
    # Beschikbaarheid
    available_days: List[str] = []
    available_time_blocks: List[str] = []
    available_schedule: Optional[dict] = None  # nieuw: { 'maandag': ['ochtend','avond'], ... }
    session_duration_min: Optional[int] = 60
    session_duration_max: Optional[int] = 120
    start_date: Optional[str] = None
    arrangement_duration: Optional[str] = 'ongoing'
    
    # Budget
    budget_min_euro: Optional[int] = None
    budget_max_euro: Optional[int] = None
    budget_type: Optional[str] = 'monthly'
    
    # Ervaring
    experience_years: Optional[int] = None
    certification_level: Optional[str] = None  # legacy, kept for compatibility
    certifications: List[str] = []  # new multi-select
    comfort_levels: dict = {}
    riding_styles: List[str] = []  # new: styles & tack experience
    
    # Doelen
    riding_goals: List[str] = []
    discipline_preferences: List[str] = []
    personality_style: List[str] = []
    # Activiteiten
    activity_mode: Optional[str] = None  # care_only | ride_or_care | ride_only
    activity_preferences: List[str] = []
    mennen_experience: Optional[str] = None
    
    # Taken
    willing_tasks: List[str] = []
    task_frequency: Optional[str] = None
    
    # Voorkeuren
    material_preferences: dict = {}
    health_restrictions: List[str] = []
    insurance_coverage: bool = False
    no_gos: List[str] = []
    
    # Media
    photos: List[str] = []
    video_intro_url: Optional[str] = None

# ---------------- Owner & Horses -----------------

class OwnerProfilePayload(BaseModel):
    # User fields (sync with Kinde like rider)
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    # Owner profile fields
    postcode: Optional[str] = None
    visible_radius: Optional[int] = None
    house_number: Optional[str] = None  # future: may require migration
    city: Optional[str] = None          # future: may require migration
    date_of_birth: Optional[str] = None # optional, if we later want to compute age

class HorsePayload(BaseModel):
    id: Optional[int] = None  # when provided -> update
    title: Optional[str] = None
    description: Optional[str] = None
    ad_type: Optional[str] = None           # bijrijden/verzorgen/lease
    ad_types: Optional[list] = None         # multi-select
    name: Optional[str] = None
    type: Optional[str] = None           # pony/horse
    height: Optional[int] = None         # cm
    age: Optional[int] = None
    gender: Optional[str] = None
    breed: Optional[str] = None
    disciplines: Optional[dict] = None   # simple dict or list mapping
    max_jump_height: Optional[int] = None
    required_tasks: Optional[list] = None
    optional_tasks: Optional[list] = None
    task_frequency: Optional[str] = None
    available_days: Optional[dict] = None  # same week/dayparts format as riders
    min_days_per_week: Optional[int] = None
    session_duration_min: Optional[int] = None
    session_duration_max: Optional[int] = None
    cost_model: Optional[str] = None
    cost_amount: Optional[int] = None
    coat_colors: Optional[list] = None
    level: Optional[str] = None
    comfort_flags: Optional[dict] = None
    activity_mode: Optional[str] = None
    required_skills: Optional[list] = None
    desired_rider_personality: Optional[list] = None
    rules: Optional[dict] = None
    no_gos: Optional[list] = None
    is_available: Optional[bool] = None

@app.get("/owner-profile")
async def get_owner_profile(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Try to get latest Kinde claims for immediate reflection
    kinde_claims = {}
    try:
        auth_header = request.headers.get("authorization") or request.headers.get("Authorization")
        if auth_header and auth_header.lower().startswith("bearer "):
            token = auth_header.split(" ", 1)[1]
            from auth import verify_kinde_token
            kinde_claims = verify_kinde_token(token) or {}
    except Exception:
        kinde_claims = {}

    # Extract possible latest name/phone from claims
    given = (kinde_claims.get("given_name") or kinde_claims.get("first_name") or "").strip()
    family = (kinde_claims.get("family_name") or kinde_claims.get("last_name") or "").strip()
    full_claim_name = (given + (" " + family if family else "")).strip() or (kinde_claims.get("name") or "").strip()
    claim_phone = (kinde_claims.get("phone_number") or "").strip()

    # Best-effort: sync local user record if claims provide fresher values
    updated = False
    if full_claim_name and (current_user.name or "").strip() != full_claim_name:
        current_user.name = full_claim_name
        updated = True
    if claim_phone and (current_user.phone or "").strip() != claim_phone:
        current_user.phone = claim_phone
        updated = True
    if updated:
        db.add(current_user)
        db.commit()
        db.refresh(current_user)

    owner = db.query(OwnerProfile).filter(OwnerProfile.user_id == current_user.id).first()
    if not owner:
        return {
            "exists": False,
            "user": {
                "name": full_claim_name or current_user.name,
                "email": current_user.email,
                "phone": claim_phone or current_user.phone,
                "kinde_given_name": given,
                "kinde_family_name": family,
            },
            "profile": {}
        }
    return {
        "exists": True,
        "user": {
            "name": full_claim_name or current_user.name,
            "email": current_user.email,
            "phone": claim_phone or current_user.phone,
            "kinde_given_name": given,
            "kinde_family_name": family,
        },
        "profile": {
            "postcode": owner.postcode,
            "house_number": owner.house_number,
            "city": owner.city,
            "visible_radius": owner.visible_radius,
            "available_days": owner.available_days or {},
            "duration": owner.duration,
            "date_of_birth": owner.date_of_birth.isoformat() if owner.date_of_birth else None,
        }
    }

@app.post("/owner-profile")
async def create_or_update_owner_profile(
    payload: OwnerProfilePayload,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    owner = db.query(OwnerProfile).filter(OwnerProfile.user_id == current_user.id).first()
    if not owner:
        owner = OwnerProfile(
            user_id=current_user.id,
            postcode=payload.postcode or "",
            visible_radius=(payload.visible_radius if payload.visible_radius is not None else 10),
            available_days={},
            duration=None,
        )
        db.add(owner)
    else:
        # payload-gedreven updates
        if payload.postcode is not None:
            owner.postcode = payload.postcode
        if payload.visible_radius is not None:
            try:
                owner.visible_radius = int(payload.visible_radius)
            except Exception:
                pass
    # New fields now supported
    if hasattr(payload, 'house_number') and payload.house_number is not None:
        owner.house_number = payload.house_number
    if hasattr(payload, 'city') and payload.city is not None:
        owner.city = payload.city
    if hasattr(payload, 'date_of_birth') and payload.date_of_birth is not None:
        try:
            # Accept YYYY-MM-DD
            from datetime import datetime
            owner.date_of_birth = datetime.strptime(payload.date_of_birth, "%Y-%m-%d").date()
        except Exception:
            pass

    # Update User fields (name/phone) and sync to Kinde like rider flow
    name_updated = False
    if (payload.first_name or payload.last_name):
        parts = []
        if payload.first_name: parts.append(payload.first_name)
        if payload.last_name: parts.append(payload.last_name)
        new_name = " ".join(parts).strip()
        if new_name:
            current_user.name = new_name
            name_updated = True
    if payload.phone is not None:
        current_user.phone = payload.phone

    # Best-effort Kinde Management API sync
    try:
        m2m_client_id = os.getenv("KINDE_M2M_CLIENT_ID")
        m2m_client_secret = os.getenv("KINDE_M2M_CLIENT_SECRET")
        kinde_domain = os.getenv("KINDE_DOMAIN")
        kinde_audience = os.getenv("KINDE_AUDIENCE")
        kinde_scope = os.getenv("KINDE_M2M_SCOPE")
        if m2m_client_id and m2m_client_secret and kinde_domain:
            token_resp = requests.post(
                f"{kinde_domain}/oauth2/token",
                data={
                    "grant_type": "client_credentials",
                    "client_id": m2m_client_id,
                    "client_secret": m2m_client_secret,
                    **({"audience": kinde_audience} if kinde_audience else {}),
                    **({"scope": kinde_scope} if kinde_scope else {}),
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"},
                timeout=10,
            )
            if token_resp.ok:
                access_token = token_resp.json().get("access_token")
                base_endpoint = f"{kinde_domain}/api/v1/user"
                # sync name
                if name_updated and current_user.name:
                    parts = current_user.name.strip().split(" ", 1)
                    given = parts[0] if parts else ""
                    family = parts[1] if len(parts) > 1 else ""
                    requests.patch(
                        base_endpoint,
                        json={
                            "first_name": given,
                            "last_name": family,
                            "given_name": given,
                            "family_name": family,
                            "name": current_user.name,
                        },
                        params={"id": current_user.kinde_id},
                        headers={"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"},
                        timeout=10,
                    )
                # sync phone
                if payload.phone is not None:
                    requests.patch(
                        base_endpoint,
                        json={"phone_number": current_user.phone},
                        params={"id": current_user.kinde_id},
                        headers={"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"},
                        timeout=10,
                    )
    except Exception:
        pass

    db.commit()
    db.refresh(owner)
    return {"message": "Owner profile saved", "owner_profile_id": owner.id}

@app.get("/owner/horses")
async def list_owner_horses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    owner = db.query(OwnerProfile).filter(OwnerProfile.user_id == current_user.id).first()
    if not owner:
        return {"horses": []}
    horses = db.query(HorseProfile).filter(HorseProfile.owner_profile_id == owner.id).all()
    return {
        "horses": [
            {
                "id": h.id,
                "title": h.title,
                "ad_type": h.ad_type,
                "ad_types": h.ad_types or [],
                "name": h.name,
                "type": h.type,
                "height": h.height,
                "age": h.age,
                "gender": h.gender,
                "breed": h.breed,
                "disciplines": h.disciplines or {},
                "max_jump_height": h.max_jump_height,
                "level": h.level,
                "required_tasks": h.required_tasks or [],
                "optional_tasks": h.optional_tasks or [],
                "task_frequency": h.task_frequency,
                "available_days": h.available_days or {},
                "min_days_per_week": h.min_days_per_week,
                "no_gos": (json.loads(h.no_gos) if isinstance(h.no_gos, str) and h.no_gos else []),
                "is_available": h.is_available,
            } for h in horses
        ]
    }

@app.post("/media/upload")
async def upload_media(
    request: Request,
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_user),
):
    urls: List[str] = []
    saved_files: List[str] = []
    for f in files:
        # Only allow images
        filename = f.filename or "upload"
        ext = os.path.splitext(filename)[1].lower()
        if ext not in [".jpg", ".jpeg", ".png", ".webp"]:
            continue
        unique = f"{uuid.uuid4().hex}{ext}"
        dest_path = os.path.join(UPLOAD_ROOT, unique)
        with open(dest_path, "wb") as out:
            out.write(await f.read())
        saved_files.append(unique)
    base = str(request.base_url).rstrip('/')
    urls = [f"{base}/uploads/{name}" for name in saved_files]
    return {"urls": urls}

@app.post("/owner/horses")
async def create_or_update_horse(
    payload: HorsePayload,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    owner = db.query(OwnerProfile).filter(OwnerProfile.user_id == current_user.id).first()
    if not owner:
        # maak owner profiel minimaal als het nog niet bestaat
        owner = OwnerProfile(user_id=current_user.id, postcode="", visible_radius=10, available_days={})
        db.add(owner)
        db.commit()
        db.refresh(owner)

    if payload.id:
        horse = db.query(HorseProfile).filter(HorseProfile.id == payload.id, HorseProfile.owner_profile_id == owner.id).first()
        if not horse:
            raise HTTPException(status_code=404, detail="Horse not found")
    else:
        horse = HorseProfile(owner_profile_id=owner.id, name=payload.name or "", type=payload.type or "pony")
        db.add(horse)

    # payload-gedreven updates
    if payload.title is not None:
        horse.title = payload.title
    if payload.description is not None:
        horse.description = payload.description
    if payload.ad_type is not None:
        horse.ad_type = payload.ad_type
    if payload.ad_types is not None:
        horse.ad_types = payload.ad_types
    if payload.name is not None:
        horse.name = payload.name
    if payload.type is not None:
        horse.type = payload.type
    if payload.height is not None:
        try:
            horse.height = int(payload.height)
        except Exception:
            pass
    if payload.age is not None:
        try:
            horse.age = int(payload.age)
        except Exception:
            pass
    if payload.gender is not None:
        horse.gender = payload.gender
    if payload.breed is not None:
        horse.breed = payload.breed
    if payload.disciplines is not None:
        horse.disciplines = payload.disciplines
    if payload.level is not None:
        horse.level = payload.level
    if payload.max_jump_height is not None:
        try:
            horse.max_jump_height = int(payload.max_jump_height)
        except Exception:
            pass
    if payload.coat_colors is not None:
        horse.coat_colors = payload.coat_colors
    if payload.temperament is not None:
        horse.temperament = payload.temperament
    if payload.required_tasks is not None:
        horse.required_tasks = payload.required_tasks
    if payload.optional_tasks is not None:
        horse.optional_tasks = payload.optional_tasks
    if payload.task_frequency is not None:
        horse.task_frequency = payload.task_frequency
    if payload.available_days is not None and isinstance(payload.available_days, dict):
        horse.available_days = payload.available_days
    if payload.min_days_per_week is not None:
        try:
            horse.min_days_per_week = int(payload.min_days_per_week)
        except Exception:
            pass
    if payload.session_duration_min is not None:
        horse.session_duration_min = payload.session_duration_min
    if payload.session_duration_max is not None:
        horse.session_duration_max = payload.session_duration_max
    if payload.cost_model is not None:
        horse.cost_model = payload.cost_model
    if payload.cost_amount is not None:
        try:
            horse.cost_amount = int(payload.cost_amount)
        except Exception:
            pass
    if payload.comfort_flags is not None:
        horse.comfort_flags = payload.comfort_flags
    if payload.activity_mode is not None:
        horse.activity_mode = payload.activity_mode
    if payload.required_skills is not None:
        horse.required_skills = payload.required_skills
    if payload.desired_rider_personality is not None:
        horse.desired_rider_personality = payload.desired_rider_personality
    if payload.rules is not None:
        horse.rules = payload.rules
    if payload.no_gos is not None:
        horse.no_gos = json.dumps(payload.no_gos)
    if payload.is_available is not None:
        horse.is_available = bool(payload.is_available)

    db.commit()
    db.refresh(horse)
    return {"message": "Horse saved", "horse_id": horse.id}
# Let only one GET endpoint exist (frontend-shaped response)

@app.post("/rider-profile")
async def create_or_update_rider_profile(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create or update rider profile"""
    # Defensief: zorg dat 'payload' altijd bestaat in deze scope
    payload = {}
    try:
        # Lees raw body om te zien wat er wordt verzonden
        body = await request.body()
        print(f"Raw request body: {body}")
        
        # Parse JSON manually
        import json
        raw_data = json.loads(body)
        print(f"Parsed JSON data: {raw_data}")
        payload = raw_data if isinstance(raw_data, dict) else {}
        
        # Probeer Pydantic model
        profile_data = RiderProfileCreate(**raw_data)
        print(f"Pydantic model created successfully: {profile_data.dict()}")
        
    except Exception as e:
        print(f"Error parsing request: {e}")
        raise HTTPException(status_code=422, detail=f"Validation error: {str(e)}")
    
    print(f"Current user: {current_user.id}, {current_user.email}")
    
    # Check if rider profile already exists
    existing_profile = db.query(RiderProfile).filter(RiderProfile.user_id == current_user.id).first()
    print(f"Existing profile found: {existing_profile is not None}")

    # CREATE path: if no profile yet, create one now (including DOB -> age)
    if not existing_profile:
        data = profile_data.dict()
        # Compose availability dict from arrays or per-day schedule
        availability_dict = {}
        if isinstance(data.get('available_schedule'), dict):
            availability_dict = data.get('available_schedule') or {}
        else:
            availability_dict = {d: (data.get('available_time_blocks') or []) for d in (data.get('available_days') or [])}

        new_profile = RiderProfile(
            user_id=current_user.id,
            postcode=data.get('postcode', '') or '',
            house_number=data.get('house_number') or '',
            city=data.get('city') or '',
            max_travel_distance=data.get('max_travel_distance_km', 25) or 25,
            transport_options=data.get('transport_options', []) or [],
            available_days=availability_dict,
            session_duration_min=data.get('session_duration_min'),
            session_duration_max=data.get('session_duration_max'),
            min_days_per_week=data.get('min_days_per_week'),
            budget_min=data.get('budget_min_euro'),
            budget_max=data.get('budget_max_euro'),
            years_experience=data.get('experience_years'),
            goals=data.get('riding_goals', []) or [],
            discipline_preferences=data.get('discipline_preferences', []) or [],
            riding_styles=data.get('riding_styles', []) or [],
            general_skills=data.get('general_skills', []) or [],
            lease_preferences=data.get('lease_preferences') or None,
            personality_style=data.get('personality_style', []) or [],
            activity_mode=data.get('activity_mode'),
            activity_preferences=data.get('activity_preferences', []) or [],
            mennen_experience=data.get('mennen_experience'),
            willing_tasks=data.get('willing_tasks', []) or [],
            task_frequency=data.get('task_frequency') or '',
            photos=data.get('photos', []) or [],
            video_intro=data.get('video_intro_url') or '',
            has_insurance=bool(data.get('insurance_coverage')),
            no_gos=json.dumps(data.get('no_gos', [])),
            health_limitations=json.dumps(data.get('health_restrictions', [])),
            parent_consent=data.get('parent_consent') if 'parent_consent' in data else None,
            parent_contact=data.get('parent_contact') if 'parent_contact' in data else None,
            rider_height_cm=(int(data['rider_height_cm']) if str(data.get('rider_height_cm') or '').strip() != '' else None),
            rider_weight_kg=(int(data['rider_weight_kg']) if str(data.get('rider_weight_kg') or '').strip() != '' else None),
            rider_bio=data.get('rider_bio') or None,
        )

        # Comfort levels mapping
        comfort = data.get('comfort_levels') or {}
        if 'traffic' in comfort:
            new_profile.comfortable_with_traffic = bool(comfort['traffic'])
        if 'outdoor_solo' in comfort:
            new_profile.comfortable_solo_outside = bool(comfort['outdoor_solo'])
        if 'jumping_height' in comfort and comfort['jumping_height'] is not None:
            try:
                new_profile.max_jump_height = int(comfort['jumping_height'])
            except Exception:
                pass
        if 'nervous_horses' in comfort:
            new_profile.comfortable_with_nervous_horses = bool(comfort['nervous_horses'])
        if 'young_horses' in comfort:
            new_profile.comfortable_with_young_horses = bool(comfort['young_horses'])
        if 'stallions' in comfort:
            new_profile.comfortable_with_stallions = bool(comfort['stallions'])

        # Dedicated comfort flag for trail rides (no coupling to discipline)
        if 'trail_rides' in comfort:
            try:
                new_profile.comfortable_with_trail_rides = bool(comfort['trail_rides'])
            except Exception:
                new_profile.comfortable_with_trail_rides = False

        # Certifications mapping
        certifications = data.get('certifications', [])
        new_profile.certifications = certifications

        # Material preferences mapping
        material = data.get('material_preferences', {})
        if 'bitless_ok' in material:
            new_profile.bitless_ok = bool(material['bitless_ok'])
        if 'auxiliary_reins' in material and material['auxiliary_reins'] is not None:
            new_profile.training_aids_ok = bool(material['auxiliary_reins'])
        if 'spurs' in material and material['spurs'] is not None:
            new_profile.spurs_ok = bool(material['spurs'])

        # Date of birth -> date + age
        dob_str = data.get('date_of_birth')
        if dob_str:
            try:
                from datetime import datetime, date
                try:
                    dob = datetime.strptime(dob_str, "%d-%m-%Y").date()
                except ValueError:
                    dob = datetime.strptime(dob_str, "%Y-%m-%d").date()
                new_profile.date_of_birth = dob
                today = date.today()
                age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
                new_profile.age = max(age, 0)
            except Exception as e:
                print(f"Failed to parse date_of_birth on create '{dob_str}': {e}")
        else:
            # fallback age if unknown
            new_profile.age = 25

        # If first/last provided, update User.name too
        name_parts = []
        if data.get('first_name'): name_parts.append(data['first_name'])
        if data.get('last_name'): name_parts.append(data['last_name'])
        if name_parts:
            current_user.name = ' '.join(name_parts)

        db.add(current_user)
        db.add(new_profile)
        print("About to commit changes to database (create)...")
        db.commit()
        db.refresh(new_profile)
        return {"message": "Rider profile created", "profile_id": new_profile.id}
    
    # Map Pydantic fields naar database fields
    field_mapping = {
        'first_name': None,  # Niet in database - zit in User.name
        'last_name': None,   # Niet in database - zit in User.name  
        'phone': None,       # Niet in database - zit in User.phone
        'date_of_birth': None, # Speciaal: mappen naar date_of_birth + age
        'postcode': 'postcode',
        'house_number': 'house_number',
        'city': 'city',
        'max_travel_distance_km': 'max_travel_distance',
        'transport_options': 'transport_options',
        'available_days': None,  # Speciaal: combineren met available_time_blocks
        'available_time_blocks': None,  # Speciaal
        'session_duration_min': 'session_duration_min',
        'session_duration_max': 'session_duration_max',
        'start_date': 'start_date',
        'arrangement_duration': 'duration_preference',
        'budget_min_euro': 'budget_min',
        'budget_max_euro': 'budget_max',
        'budget_type': None,  # Niet in database
        'experience_years': 'years_experience',
        'certification_level': 'fnrs_level',  # legacy mapping to fnrs_level
        'certifications': 'certifications',
        'comfort_levels': None,  # Mapping naar meerdere boolean velden
        'riding_goals': 'goals',
        'discipline_preferences': 'discipline_preferences',
        'riding_styles': 'riding_styles',
        'personality_style': 'personality_style',
        'willing_tasks': 'willing_tasks',
        'task_frequency': 'task_frequency',
        'material_preferences': None,  # Mapping naar meerdere boolean velden
        'health_restrictions': 'health_limitations',
        'insurance_coverage': 'has_insurance',
        'no_gos': 'no_gos',
        'photos': 'photos',
        'video_intro_url': 'video_intro',
    }

    if existing_profile:
        # Update existing profile met field mapping
        data = profile_data.dict()

        # Update User fields
        if data.get('first_name') or data.get('last_name'):
            name_parts = []
            if data.get('first_name'): name_parts.append(data['first_name'])
            if data.get('last_name'): name_parts.append(data['last_name'])
            if name_parts:
                new_name = ' '.join(name_parts)
                current_user.name = new_name
                # Best-effort: sync naam naar Kinde via Management API (indien M2M creds aanwezig)
                try:
                    m2m_client_id = os.getenv("KINDE_M2M_CLIENT_ID")
                    m2m_client_secret = os.getenv("KINDE_M2M_CLIENT_SECRET")
                    kinde_domain = os.getenv("KINDE_DOMAIN")
                    kinde_audience = os.getenv("KINDE_AUDIENCE")
                    kinde_scope = os.getenv("KINDE_M2M_SCOPE")
                    if m2m_client_id and m2m_client_secret and kinde_domain:
                        print(f"Kinde M2M token: audience={kinde_audience}, scope={kinde_scope}")
                        token_resp = requests.post(
                            f"{kinde_domain}/oauth2/token",
                            data={
                                "grant_type": "client_credentials",
                                "client_id": m2m_client_id,
                                "client_secret": m2m_client_secret,
                                **({"audience": kinde_audience} if kinde_audience else {}),
                                **({"scope": kinde_scope} if kinde_scope else {}),
                            },
                            headers={"Content-Type": "application/x-www-form-urlencoded"},
                            timeout=10,
                        )
                        if not token_resp.ok:
                            print(f"Kinde M2M token FAILED status={token_resp.status_code} body={token_resp.text}")
                        if token_resp.ok:
                            access_token = token_resp.json().get("access_token")
                            # Split voor- en achternaam indien mogelijk
                            parts = new_name.strip().split(" ", 1)
                            given = parts[0] if parts else ""
                            family = parts[1] if len(parts) > 1 else ""
                            # Kinde Management API: update user profiel
                            # API pad kan per versie verschillen; we proberen generiek endpoint
                            # Gebruik query-param endpoint volgens docs: /api/v1/user?id=<user_id>
                            base_endpoint = f"{kinde_domain}/api/v1/user"
                            # Probe met GET en params
                            try:
                                probe = requests.get(base_endpoint, params={"id": current_user.kinde_id}, headers={"Authorization": f"Bearer {access_token}"}, timeout=10)
                                print(f"Kinde GET probe {base_endpoint}?id=... -> {probe.status_code}")
                            except Exception as _:
                                probe = None
                            print(f"Kinde name PATCH endpoint: {base_endpoint}?id={current_user.kinde_id}")
                            print(f"Kinde name PATCH for user={current_user.kinde_id} given_name='{given}' family_name='{family}' name='{new_name}'")
                            patch_resp = requests.patch(
                                base_endpoint,
                                json={
                                    # Stuur beide varianten voor maximale compatibiliteit
                                    "first_name": given,
                                    "last_name": family,
                                    "given_name": given,
                                    "family_name": family,
                                    "name": new_name,
                                },
                                params={"id": current_user.kinde_id},
                                headers={"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"},
                                timeout=10,
                            )
                            print(f"Kinde name PATCH status={patch_resp.status_code} body={patch_resp.text}")
                    else:
                        print("Skipping Kinde name sync: missing M2M env variables or KINDE_DOMAIN")
                except Exception as _:
                    # Niet fatal; doorgaan met lokale update
                    pass

        if data.get('phone'):
            current_user.phone = data['phone']
            # Best-effort: sync telefoon naar Kinde (indien M2M creds aanwezig)
            try:
                m2m_client_id = os.getenv("KINDE_M2M_CLIENT_ID")
                m2m_client_secret = os.getenv("KINDE_M2M_CLIENT_SECRET")
                kinde_domain = os.getenv("KINDE_DOMAIN")
                kinde_audience = os.getenv("KINDE_AUDIENCE")
                kinde_scope = os.getenv("KINDE_M2M_SCOPE")
                if m2m_client_id and m2m_client_secret and kinde_domain:
                    print(f"Kinde M2M token (phone): audience={kinde_audience}, scope={kinde_scope}")
                    token_resp = requests.post(
                        f"{kinde_domain}/oauth2/token",
                        data={
                            "grant_type": "client_credentials",
                            "client_id": m2m_client_id,
                            "client_secret": m2m_client_secret,
                            **({"audience": kinde_audience} if kinde_audience else {}),
                            **({"scope": kinde_scope} if kinde_scope else {}),
                        },
                        headers={"Content-Type": "application/x-www-form-urlencoded"},
                        timeout=10,
                    )
                    if not token_resp.ok:
                        print(f"Kinde M2M token FAILED status={token_resp.status_code} body={token_resp.text}")
                    if token_resp.ok:
                        access_token = token_resp.json().get("access_token")
                        # Endpoint met query param
                        base_endpoint = f"{kinde_domain}/api/v1/user"
                        try:
                            probe = requests.get(base_endpoint, params={"id": current_user.kinde_id}, headers={"Authorization": f"Bearer {access_token}"}, timeout=10)
                            print(f"Kinde GET probe {base_endpoint}?id=... -> {probe.status_code}")
                        except Exception as _:
                            probe = None
                        print(f"Kinde phone PATCH endpoint: {base_endpoint}?id={current_user.kinde_id}")
                        print(f"Kinde phone PATCH for user={current_user.kinde_id} phone='{current_user.phone}'")
                        patch_resp = requests.patch(
                            base_endpoint,
                            json={
                                "phone_number": current_user.phone,
                            },
                            params={"id": current_user.kinde_id},
                            headers={"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"},
                            timeout=10,
                        )
                        print(f"Kinde phone PATCH status={patch_resp.status_code} body={patch_resp.text}")
                else:
                    print("Skipping Kinde phone sync: missing M2M env variables or KINDE_DOMAIN")
            except Exception:
                pass

    if data.get('phone'):
        current_user.phone = data['phone']
        # Best-effort: sync telefoon naar Kinde (indien M2M creds aanwezig)
        try:
            m2m_client_id = os.getenv("KINDE_M2M_CLIENT_ID")
            m2m_client_secret = os.getenv("KINDE_M2M_CLIENT_SECRET")
            kinde_domain = os.getenv("KINDE_DOMAIN")
            kinde_audience = os.getenv("KINDE_AUDIENCE")
            kinde_scope = os.getenv("KINDE_M2M_SCOPE")
            if m2m_client_id and m2m_client_secret and kinde_domain:
                print(f"Kinde M2M token (phone): audience={kinde_audience}, scope={kinde_scope}")
                token_resp = requests.post(
                    f"{kinde_domain}/oauth2/token",
                    data={
                        "grant_type": "client_credentials",
                        "client_id": m2m_client_id,
                        "client_secret": m2m_client_secret,
                        **({"audience": kinde_audience} if kinde_audience else {}),
                        **({"scope": kinde_scope} if kinde_scope else {}),
                    },
                    headers={"Content-Type": "application/x-www-form-urlencoded"},
                    timeout=10,
                )
                if not token_resp.ok:
                    print(f"Kinde M2M token FAILED status={token_resp.status_code} body={token_resp.text}")
                if token_resp.ok:
                    access_token = token_resp.json().get("access_token")
                    # Endpoint met query param
                    base_endpoint = f"{kinde_domain}/api/v1/user"
                    try:
                        probe = requests.get(base_endpoint, params={"id": current_user.kinde_id}, headers={"Authorization": f"Bearer {access_token}"}, timeout=10)
                        print(f"Kinde GET probe {base_endpoint}?id=... -> {probe.status_code}")
                    except Exception as _:
                        probe = None
                    print(f"Kinde phone PATCH endpoint: {base_endpoint}?id={current_user.kinde_id}")
                    print(f"Kinde phone PATCH for user={current_user.kinde_id} phone='{current_user.phone}'")
                    patch_resp = requests.patch(
                        base_endpoint,
                        json={
                            "phone_number": current_user.phone,
                        },
                        params={"id": current_user.kinde_id},
                        headers={"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"},
                        timeout=10,
                    )
                    print(f"Kinde phone PATCH status={patch_resp.status_code} body={patch_resp.text}")
            else:
                print("Skipping Kinde phone sync: missing M2M env variables or KINDE_DOMAIN")
        except Exception:
            pass

        # 1) Basisvelden direct uit payload mappen (alleen als meegegeven)
        direct_map = {
            'postcode': 'postcode',
            'house_number': 'house_number',
            'city': 'city',
            'max_travel_distance_km': 'max_travel_distance',
            'transport_options': 'transport_options',
            'session_duration_min': 'session_duration_min',
            'session_duration_max': 'session_duration_max',
            'min_days_per_week': 'min_days_per_week',
            'start_date': 'start_date',
            'arrangement_duration': 'duration_preference',
            'budget_min_euro': 'budget_min',
            'budget_max_euro': 'budget_max',
            'experience_years': 'years_experience',
            'certifications': 'certifications',
            'riding_styles': 'riding_styles',
            'personality_style': 'personality_style',
            'willing_tasks': 'willing_tasks',
            'task_frequency': 'task_frequency',
            'photos': 'photos',
            'video_intro_url': 'video_intro',
            'insurance_coverage': 'has_insurance',
            'health_restrictions': 'health_limitations',
            'no_gos': 'no_gos',
            'parent_consent': 'parent_consent',
            'parent_contact': 'parent_contact',
            'rider_height_cm': 'rider_height_cm',
            'rider_weight_kg': 'rider_weight_kg',
            'rider_bio': 'rider_bio',
        }
        for src, dest in direct_map.items():
            if src in payload:
                val = payload.get(src)
                # type conversies
                if dest in ('max_travel_distance', 'session_duration_min', 'session_duration_max', 'min_days_per_week', 'budget_min', 'budget_max', 'years_experience'):
                    try:
                        val = int(val) if val is not None else None
                    except Exception:
                        pass
                if dest in ('rider_height_cm','rider_weight_kg'):
                    try:
                        val = int(val) if (val is not None and str(val).strip() != '') else None
                    except Exception:
                        val = None
                if dest in ('has_insurance',):
                    val = bool(val)
                if dest in ('health_limitations', 'no_gos') and isinstance(val, list):
                    val = json.dumps(val)
                setattr(existing_profile, dest, val)

        # Speciaal: geboortedatum en leeftijd bijwerken indien meegegeven
        if 'date_of_birth' in payload:
            dob_str = payload.get('date_of_birth')
            if dob_str:
                try:
                    from datetime import datetime, date
                    try:
                        dob = datetime.strptime(dob_str, "%d-%m-%Y").date()
                    except ValueError:
                        dob = datetime.strptime(dob_str, "%Y-%m-%d").date()
                    existing_profile.date_of_birth = dob
                    today = date.today()
                    age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
                    existing_profile.age = max(age, 0)
                except Exception as e:
                    print(f"Failed to parse date_of_birth on update '{dob_str}': {e}")

        # 1b) Lease preferences (JSON dict)
        if 'lease_preferences' in payload and isinstance(payload.get('lease_preferences'), dict):
            existing_profile.lease_preferences = payload.get('lease_preferences')
        # 1c) Desired horse (JSON dict)
        if 'desired_horse' in payload and isinstance(payload.get('desired_horse'), dict):
            existing_profile.desired_horse = payload.get('desired_horse')

        # 2) Availability
        if 'available_schedule' in payload and isinstance(payload.get('available_schedule'), dict):
            # prefer per-day schedule if provided
            existing_profile.available_days = payload.get('available_schedule') or {}
        else:
            # fallback to arrays -> same blocks for all selected days
            days_arr = payload.get('available_days') if 'available_days' in payload else (data.get('available_days') or [])
            blocks_arr = payload.get('available_time_blocks') if 'available_time_blocks' in payload else (data.get('available_time_blocks') or [])
            if isinstance(days_arr, list) and isinstance(blocks_arr, list) and (days_arr or blocks_arr):
                existing_profile.available_days = {d: blocks_arr for d in days_arr}

        # 2b) Goals/Discipline/Personality explicit updates if provided
        if 'riding_goals' in payload and isinstance(payload.get('riding_goals'), list):
            existing_profile.goals = payload.get('riding_goals')
        if 'discipline_preferences' in payload and isinstance(payload.get('discipline_preferences'), list):
            existing_profile.discipline_preferences = payload.get('discipline_preferences')
        if 'personality_style' in payload and isinstance(payload.get('personality_style'), list):
            existing_profile.personality_style = payload.get('personality_style')
        if 'general_skills' in payload and isinstance(payload.get('general_skills'), list):
            existing_profile.general_skills = payload.get('general_skills')

        # 3) Comfort: map booleans and trail_rides discipline toggle
        comfort = payload.get('comfort_levels') if 'comfort_levels' in payload else (data.get('comfort_levels') or {})
        if 'traffic' in comfort:
            existing_profile.comfortable_with_traffic = bool(comfort['traffic'])
        if 'outdoor_solo' in comfort:
            existing_profile.comfortable_solo_outside = bool(comfort['outdoor_solo'])
        if 'jumping_height' in comfort and comfort['jumping_height'] is not None:
            try:
                existing_profile.max_jump_height = int(comfort['jumping_height'])
            except Exception:
                pass
        if 'nervous_horses' in comfort:
            existing_profile.comfortable_with_nervous_horses = bool(comfort['nervous_horses'])
        if 'young_horses' in comfort:
            existing_profile.comfortable_with_young_horses = bool(comfort['young_horses'])
        if 'stallions' in comfort:
            existing_profile.comfortable_with_stallions = bool(comfort['stallions'])
        if 'trail_rides' in comfort:
            try:
                existing_profile.comfortable_with_trail_rides = bool(comfort['trail_rides'])
            except Exception:
                pass

        # 4) Activities on UPDATE (use payload keys only)
        if 'activity_mode' in payload:
            existing_profile.activity_mode = payload.get('activity_mode')
        if 'activity_preferences' in payload and isinstance(payload.get('activity_preferences'), list):
            existing_profile.activity_preferences = payload.get('activity_preferences')
        if 'mennen_experience' in payload:
            existing_profile.mennen_experience = payload.get('mennen_experience')

        # 4b) Normalize by activity_mode to keep data consistent
        mode = existing_profile.activity_mode
        care_keys = ['verzorging','grondwerk','longeren','hand_walking','pasture_turnout','medical_assist']
        ride_keys = ['buitenritten','dressuur_training','springen_training']
        if mode == 'care_only':
            # Keep only care subitems; clear ride-related meta
            prefs = existing_profile.activity_preferences or []
            existing_profile.activity_preferences = [k for k in prefs if k in care_keys]
            existing_profile.mennen_experience = None
            # Goals/discipline not applicable
            existing_profile.goals = []
            existing_profile.discipline_preferences = []
        elif mode == 'ride_only':
            # No subactivities; no mennen
            existing_profile.activity_preferences = []
            existing_profile.mennen_experience = None
            # Goals/discipline remain as selected by user
        elif mode == 'drive_only':
            # Only mennen path; no subactivities, no riding goals/discipline
            existing_profile.activity_preferences = []
            existing_profile.goals = []
            existing_profile.discipline_preferences = []
        elif mode == 'ride_or_care':
            # Allow both care and ride subactivities, but drop anything unknown
            prefs = existing_profile.activity_preferences or []
            allowed = set(care_keys + ride_keys)
            existing_profile.activity_preferences = [k for k in prefs if k in allowed]
            existing_profile.mennen_experience = None

        # 5) Material preferences on UPDATE
        material = payload.get('material_preferences') if 'material_preferences' in payload else (data.get('material_preferences') or {})
        if 'bitless_ok' in material:
            existing_profile.bitless_ok = bool(material['bitless_ok'])
        if 'auxiliary_reins' in material and material['auxiliary_reins'] is not None:
            existing_profile.training_aids_ok = bool(material['auxiliary_reins'])
        if 'spurs' in material and material['spurs'] is not None:
            existing_profile.spurs_ok = bool(material['spurs'])

        # Commit changes
        db.add(current_user)
        db.add(existing_profile)
        print("About to commit changes to database...")
        db.commit()
        db.refresh(existing_profile)
        return {"message": "Profile updated successfully", "id": existing_profile.id}
@app.get("/rider-profile")
async def get_rider_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's rider profile"""
    
    profile = db.query(RiderProfile).filter(RiderProfile.user_id == current_user.id).first()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Rider profile not found")
    
    # Bepaal voor/achternaam: eerste deel = voornaam, rest = achternaam
    first = ""
    last = ""
    if current_user.name:
        parts = current_user.name.split(" ", 1)
        first = parts[0]
        last = parts[1] if len(parts) > 1 else ""

    # Flatten availability for frontend expectations
    flat_days = []
    flat_blocks = []
    if isinstance(profile.available_days, dict):
        flat_days = list(profile.available_days.keys())
        # Union of all blocks
        seen = set()
        for arr in profile.available_days.values():
            for b in (arr or []):
                seen.add(b)
        flat_blocks = list(seen)
    else:
        flat_days = profile.available_days if profile.available_days else []
        flat_blocks = []

    # Format DOB
    dob_str = ""
    try:
        if profile.date_of_birth:
            dob_str = profile.date_of_birth.strftime("%Y-%m-%d")
    except Exception:
        dob_str = ""

    return {
        "id": profile.id,
        "user_id": profile.user_id,
        "first_name": first,
        "last_name": last,
        "phone": current_user.phone,
        "date_of_birth": dob_str,
        "age": profile.age,
        "postcode": profile.postcode,
        "house_number": profile.house_number,
        "city": profile.city,
        "max_travel_distance_km": profile.max_travel_distance,
        "transport_options": profile.transport_options if profile.transport_options else [],
        "available_days": flat_days,
        "available_time_blocks": flat_blocks,
        "available_schedule": profile.available_days or {},
        "session_duration_min": profile.session_duration_min if profile.session_duration_min is not None else 60,
        "session_duration_max": profile.session_duration_max if profile.session_duration_max is not None else 120,
        "start_date": profile.start_date,
        "arrangement_duration": profile.duration_preference,
        "budget_min_euro": profile.budget_min,
        "budget_max_euro": profile.budget_max,
        "experience_years": profile.years_experience,
        "certification_level": profile.fnrs_level or profile.knhs_level or "",
        "certifications": profile.certifications or [],
        "comfort_levels": {
            "traffic": profile.comfortable_with_traffic,
            "outdoor_solo": profile.comfortable_solo_outside,
            "nervous_horses": bool(profile.comfortable_with_nervous_horses),
            "young_horses": bool(profile.comfortable_with_young_horses),
            "stallions": bool(profile.comfortable_with_stallions),
            "trail_rides": bool(getattr(profile, 'comfortable_with_trail_rides', False)),
            "jumping_height": profile.max_jump_height or 0
        },
        "min_days_per_week": profile.min_days_per_week,
        "riding_goals": profile.goals if profile.goals else [],
        "discipline_preferences": profile.discipline_preferences if profile.discipline_preferences else [],
        "general_skills": profile.general_skills or [],
        "riding_styles": profile.riding_styles if profile.riding_styles else [],
        "activity_mode": profile.activity_mode,
        "activity_preferences": profile.activity_preferences if profile.activity_preferences else [],
        "mennen_experience": profile.mennen_experience,
        "personality_style": profile.personality_style if profile.personality_style else [],
        "willing_tasks": profile.willing_tasks if profile.willing_tasks else [],
        "task_frequency": profile.task_frequency,
        "lease_preferences": profile.lease_preferences or {},
        "material_preferences": {
            "bitless_ok": profile.bitless_ok,
            "spurs": bool(getattr(profile, 'spurs_ok', False)),
            "auxiliary_reins": profile.training_aids_ok,
            "own_helmet": True  # UI-only default
        },
        # health_limitations/no_gos are TEXT that may contain JSON string; parse to list if possible
        "health_restrictions": (json.loads(profile.health_limitations) if isinstance(profile.health_limitations, str) and profile.health_limitations else []),
        "insurance_coverage": profile.has_insurance,
        "no_gos": (json.loads(profile.no_gos) if isinstance(profile.no_gos, str) and profile.no_gos else []),
        "photos": profile.photos if profile.photos else [],
        "video_intro_url": profile.video_intro,
        "parent_consent": profile.parent_consent,
        "parent_contact": profile.parent_contact,
        "rider_height_cm": profile.rider_height_cm,
        "rider_weight_kg": profile.rider_weight_kg,
        "rider_bio": profile.rider_bio,
        "desired_horse": profile.desired_horse or {},
        "created_at": profile.created_at,
        "updated_at": profile.updated_at
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
