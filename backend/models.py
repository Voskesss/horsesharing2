from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, Float, JSON, Date
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    kinde_id = Column(String(255), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    # Onboarding tracking
    onboarding_completed = Column(Boolean, default=False)
    profile_type_chosen = Column(String(50), nullable=True)  # "rider"/"owner"/None
    
    # Profile relationships (max 1 each)
    rider_profile = relationship("RiderProfile", back_populates="user", uselist=False)
    owner_profile = relationship("OwnerProfile", back_populates="user", uselist=False)

class RiderProfile(Base):
    __tablename__ = "rider_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    
    # Media
    photos = Column(JSON, nullable=True)  # Array of photo URLs
    video_intro = Column(String(500), nullable=True)  # Video URL
    
    # Location & Travel
    postcode = Column(String(10), nullable=False)
    house_number = Column(String(10), nullable=True)
    city = Column(String(100), nullable=True)
    max_travel_distance = Column(Integer, nullable=False)  # km
    transport_options = Column(JSON, nullable=True)  # ["auto", "openbaar_vervoer", "fiets", "te_voet"]
    
    # Availability
    available_days = Column(JSON, nullable=False)  # {"monday": ["morning", "afternoon"], ...}
    session_duration_min = Column(Integer, nullable=True)
    session_duration_max = Column(Integer, nullable=True)
    start_date = Column(DateTime, nullable=True)
    duration_preference = Column(String(50), nullable=True)  # temporary/ongoing
    min_days_per_week = Column(Integer, nullable=True)
    
    # Budget
    budget_min = Column(Integer, nullable=True)  # euros per month
    budget_max = Column(Integer, nullable=True)  # euros per month
    
    # Experience & Level
    years_experience = Column(Integer, nullable=True)
    fnrs_level = Column(String(50), nullable=True)
    knhs_level = Column(String(50), nullable=True)
    certifications = Column(JSON, nullable=True)  # list of strings e.g., ["FNRS F5", "Dressuur L2", "Springen M"]
    lesson_history = Column(Text, nullable=True)
    references = Column(Text, nullable=True)
    
    # Comfort & Abilities
    comfortable_with_traffic = Column(Boolean, default=False)
    comfortable_solo_outside = Column(Boolean, default=False)
    comfortable_with_nervous_horses = Column(Boolean, default=False)
    comfortable_with_young_horses = Column(Boolean, default=False)
    comfortable_with_stallions = Column(Boolean, default=False)
    comfortable_with_trail_rides = Column(Boolean, default=False)
    max_jump_height = Column(Integer, nullable=True)  # cm
    
    # Goals & Preferences
    goals = Column(JSON, nullable=True)  # ["recreation", "training", "competition"]
    personality_style = Column(JSON, nullable=True)  # ["patient", "consistent", "playful"]
    discipline_preferences = Column(JSON, nullable=True)  # ["dressage", "jumping", "trail"]
    riding_styles = Column(JSON, nullable=True)  # ["bitloos", "hackamore", "western", ...]
    # Skills
    general_skills = Column(JSON, nullable=True)  # ["grondwerk","longeren_basis",...]
    # Lease preferences (JSON blob, e.g. {"budget_max_pm_lease": 200, ...})
    lease_preferences = Column(JSON, nullable=True)
    # Activities
    activity_mode = Column(String(20), nullable=True)  # care_only | ride_or_care | ride_only
    activity_preferences = Column(JSON, nullable=True)  # ["verzorging","grondwerk","longeren","rijden","mennen"]
    mennen_experience = Column(String(20), nullable=True)  # beginner | gevorderd | ervaren
    
    # Tasks & Responsibilities
    willing_tasks = Column(JSON, nullable=True)  # ["mucking", "feeding", "grooming"]
    task_frequency = Column(String(50), nullable=True)
    
    # Material Preferences
    bitless_ok = Column(Boolean, default=True)
    training_aids_ok = Column(Boolean, default=True)
    spurs_ok = Column(Boolean, default=False)
    
    # Health & Limitations
    health_limitations = Column(Text, nullable=True)
    fears_anxieties = Column(Text, nullable=True)
    
    # Age & Consent
    date_of_birth = Column(Date, nullable=True)
    age = Column(Integer, nullable=False)
    parent_consent = Column(Boolean, nullable=True)  # For under 18
    parent_contact = Column(String(255), nullable=True)
    # Rider body & bio
    rider_height_cm = Column(Integer, nullable=True)
    rider_weight_kg = Column(Integer, nullable=True)
    rider_bio = Column(Text, nullable=True)
    # Desired horse preferences (JSON blob)
    desired_horse = Column(JSON, nullable=True)
    
    # Insurance
    has_insurance = Column(Boolean, default=False)
    insurance_details = Column(Text, nullable=True)
    
    # No-gos
    no_gos = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="rider_profile")
    matches_as_rider = relationship("Match", foreign_keys="Match.rider_profile_id", back_populates="rider_profile")

class OwnerProfile(Base):
    __tablename__ = "owner_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    
    # Location
    postcode = Column(String(10), nullable=False)
    house_number = Column(String(10), nullable=True)
    house_number_addition = Column(String(20), nullable=True)
    street = Column(String(255), nullable=True)
    city = Column(String(100), nullable=True)
    country_code = Column(String(2), nullable=True)
    lat = Column(Float, nullable=True)
    lon = Column(Float, nullable=True)
    geocode_confidence = Column(Float, nullable=True)
    needs_review = Column(Boolean, nullable=True)
    visible_radius = Column(Integer, nullable=False)  # km (3/5/10/20/30)
    
    # Availability
    available_days = Column(JSON, nullable=False)  # {"monday": ["morning", "afternoon"], ...}
    start_date = Column(DateTime, nullable=True)
    trial_period = Column(Integer, nullable=True)  # weeks
    duration = Column(String(50), nullable=True)  # temporary/ongoing
    # Age (optional for owner)
    date_of_birth = Column(Date, nullable=True)
    
    # Financial
    contribution_required = Column(Integer, nullable=True)  # euros per month
    deposit_required = Column(Integer, nullable=True)  # euros
    
    # Supervision & Instruction
    instruction_available = Column(Boolean, default=False)
    instruction_required = Column(Boolean, default=False)
    supervision_required = Column(Boolean, default=False)
    
    # Safety & Requirements
    min_age_requirement = Column(Integer, nullable=True)
    under_18_allowed = Column(Boolean, default=True)
    id_required = Column(Boolean, default=False)
    contract_required = Column(Boolean, default=False)
    
    # Insurance Requirements
    insurance_required = Column(Boolean, default=False)
    insurance_requirements = Column(Text, nullable=True)
    
    # Stable Rules
    helmet_required = Column(Boolean, default=True)
    boots_required = Column(Boolean, default=True)
    stable_rules = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="owner_profile")
    horse_profiles = relationship("HorseProfile", back_populates="owner_profile")

class HorseProfile(Base):
    __tablename__ = "horse_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    owner_profile_id = Column(Integer, ForeignKey("owner_profiles.id"), nullable=False)
    
    # Media
    photos = Column(JSON, nullable=True)  # Array of photo URLs
    video = Column(String(500), nullable=True)  # Video URL
    
    # Basic Info
    title = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    ad_type = Column(String(20), nullable=True)  # bijrijden/verzorgen/lease
    ad_types = Column(JSON, nullable=True)  # multi-select: ["bijrijden","lease",...]
    name = Column(String(255), nullable=False)
    type = Column(String(50), nullable=False)  # pony/horse
    height = Column(Integer, nullable=True)  # cm shoulder height
    age = Column(Integer, nullable=True)
    gender = Column(String(20), nullable=True)
    breed = Column(String(255), nullable=True)
    
    # Health & Medical
    health_restrictions = Column(Text, nullable=True)
    medication = Column(Text, nullable=True)
    farrier_schedule = Column(String(255), nullable=True)
    physio_schedule = Column(String(255), nullable=True)
    
    # Character & Energy
    energy_level = Column(String(50), nullable=True)  # low/medium/high
    temperament = Column(JSON, nullable=True)  # ["calm", "sensitive", "playful"]
    coat_colors = Column(JSON, nullable=True)  # ["vos","zwart","bruin","schimmel",...]
    triggers = Column(JSON, nullable=True)  # ["traffic", "water", "crowds"]
    enjoys = Column(JSON, nullable=True)  # ["trail_rides", "dressage", "jumping"]
    dislikes = Column(JSON, nullable=True)  # ["hard_hands", "loud_noises"]
    
    # Disciplines & Level
    disciplines = Column(JSON, nullable=True)  # {"dressage": "L1", "jumping": "80cm"}
    level = Column(String(50), nullable=True)  # L1/L2/M/Z etc.
    max_jump_height = Column(Integer, nullable=True)  # cm
    comfort_flags = Column(JSON, nullable=True)  # {traffic: true, outdoor_solo: true, with_other_horses: true}
    activity_mode = Column(String(20), nullable=True)  # ground_only/ride_only/ride_or_care/care_only
    
    # Suitability
    suitable_for_beginners = Column(Boolean, default=False)
    suitable_for_advanced = Column(Boolean, default=True)
    suitable_for_experienced_only = Column(Boolean, default=False)
    
    # Weight & Size Limits
    max_rider_weight = Column(Integer, nullable=True)  # kg
    min_rider_height = Column(Integer, nullable=True)  # cm
    max_rider_height = Column(Integer, nullable=True)  # cm
    
    # Equipment & Material Policy
    bit_bitless_policy = Column(String(50), nullable=True)  # bit_only/bitless_ok/bitless_preferred
    spurs_allowed = Column(Boolean, default=True)
    training_aids_allowed = Column(Boolean, default=True)
    bareback_allowed = Column(Boolean, default=False)
    
    # Tasks & Expectations
    required_tasks = Column(JSON, nullable=True)  # ["mucking", "feeding"]
    optional_tasks = Column(JSON, nullable=True)  # ["grooming", "turnout"]
    task_frequency = Column(String(50), nullable=True)
    required_skills = Column(JSON, nullable=True)  # mirror rider general_skills
    desired_rider_personality = Column(JSON, nullable=True)  # mirror rider personality_style
    rules = Column(JSON, nullable=True)  # {helmet_required: true, under_18_allowed: true, contract_required: false}
    
    # Facilities
    indoor_arena = Column(Boolean, default=False)
    outdoor_arena = Column(Boolean, default=False)
    lighting = Column(Boolean, default=False)
    longe_circle = Column(Boolean, default=False)
    trail_access = Column(Boolean, default=False)
    trailer_available = Column(Boolean, default=False)
    
    # Availability Status
    is_available = Column(Boolean, default=True)
    # Availability details for ads
    available_days = Column(JSON, nullable=True)
    min_days_per_week = Column(Integer, nullable=True)
    session_duration_min = Column(Integer, nullable=True)
    session_duration_max = Column(Integer, nullable=True)
    # Cost
    cost_model = Column(String(20), nullable=True)  # per_maand | per_dag
    cost_amount = Column(Integer, nullable=True)
    
    # No-gos
    no_gos = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    owner_profile = relationship("OwnerProfile", back_populates="horse_profiles")
    matches = relationship("Match", back_populates="horse_profile")

class Match(Base):
    __tablename__ = "matches"
    
    id = Column(Integer, primary_key=True, index=True)
    rider_profile_id = Column(Integer, ForeignKey("rider_profiles.id"), nullable=False)
    horse_profile_id = Column(Integer, ForeignKey("horse_profiles.id"), nullable=False)
    
    # Match Status
    rider_liked = Column(Boolean, default=False)
    owner_liked = Column(Boolean, default=False)
    is_mutual_match = Column(Boolean, default=False)
    
    # Match Score (calculated by algorithm)
    compatibility_score = Column(Float, nullable=True)
    hard_filters_passed = Column(Boolean, default=False)
    
    # Match Details
    match_reasons = Column(JSON, nullable=True)  # What made this a good match
    potential_issues = Column(JSON, nullable=True)  # Areas of concern
    
    # Status
    status = Column(String(50), default="pending")  # pending/active/paused/ended
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    rider_profile = relationship("RiderProfile", foreign_keys=[rider_profile_id], back_populates="matches_as_rider")
    horse_profile = relationship("HorseProfile", back_populates="matches")
