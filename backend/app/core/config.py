from pydantic_settings import BaseSettings, SettingsConfigDict
class Settings(BaseSettings):
    DATABASE_URL:str
    JWT_SECRET_KEY:str
    JWT_ALGORITHM:str='HS256'
    ACCESS_TOKEN_EXPIRE_MINUTES:int=30
    REFRESH_TOKEN_EXPIRE_DAYS:int=7
    CORS_ORIGINS:str='http://localhost:5173'
    model_config=SettingsConfigDict(env_file='.env',extra='ignore')
    @property
    def cors_origins_list(self): return [x.strip() for x in self.CORS_ORIGINS.split(',') if x.strip()]
settings=Settings()
