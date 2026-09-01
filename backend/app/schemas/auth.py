from pydantic import BaseModel,EmailStr,Field
class LoginRequest(BaseModel): email:EmailStr; password:str=Field(min_length=8,max_length=128)
class UserResponse(BaseModel): id:int; employee_id:str; full_name:str; email:EmailStr; role:str
class LoginResponse(BaseModel): access_token:str; refresh_token:str; token_type:str; user:UserResponse
