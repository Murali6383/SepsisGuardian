from datetime import datetime,timedelta,timezone
from jose import JWTError,jwt
from pwdlib import PasswordHash
from app.core.config import settings
ph=PasswordHash.recommended()
def hash_password(p): return ph.hash(p)
def verify_password(p,h): return ph.verify(p,h)
def token(uid,role,typ,delta):
    return jwt.encode({'sub':str(uid),'role':role,'type':typ,'exp':datetime.now(timezone.utc)+delta},settings.JWT_SECRET_KEY,algorithm=settings.JWT_ALGORITHM)
def access_token(uid,role): return token(uid,role,'access',timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
def refresh_token(uid,role): return token(uid,role,'refresh',timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS))
def decode(t): return jwt.decode(t,settings.JWT_SECRET_KEY,algorithms=[settings.JWT_ALGORITHM])
