from datetime import datetime, timedelta
from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
import sqlite3
import uvicorn


SECRET_KEY = ""
with open('secretkey.sec', 'r') as f:
	SECRET_KEY = f.readline().strip('\n')

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 43800

users_db = sqlite3.connect('users.sqlite')


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: str | None = None


class User(BaseModel):
    username: str
    email: str | None = None
    full_name: str | None = None
    is_admin: bool = False


class UserInDB(User):
    hashed_password: str


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

app = FastAPI()


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    return pwd_context.hash(password)


def get_user(username: str):
    # if username in db:
    #     user_dict = db[username]
    #     return UserInDB(**user_dict)

	cursor = users_db.cursor()
	cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
	user = cursor.fetchone()
	if user:
		return User(username=user[0], email=user[1], full_name=user[2], is_admin=user[4])


def authenticate_user(username: str, password: str):
    # user = get_user(fake_db, username)
    # if not user:
    #     return False
    # if not verify_password(password, user.hashed_password):
    #     return False
    # return user
	cursor = users_db.cursor()
	cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
	user = cursor.fetchone()
	if user:
		if verify_password(password, user[3]):
			return User(username=user[0], email=user[1], full_name=user[2], is_admin=user[4])


def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    user = get_user(username=token_data.username)
    if user is None:
        raise credentials_exception
    return user


async def get_current_active_user(
    current_user: Annotated[User, Depends(get_current_user)]
):
    return current_user


@app.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()]
):
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/signup")
async def signup(username, password, email, full_name):
	cursor = users_db.cursor()
	cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
	user = cursor.fetchone()
	if user:
		return {"error": "Username already taken"}
	else:
		cursor.execute("INSERT INTO users VALUES (?, ?, ?, ?, ?)", (username, email, full_name, get_password_hash(password), False))
		users_db.commit()
		return {"success": "User created"}
        
@app.get("/users/me/", response_model=User)
async def read_users_me(
    current_user: Annotated[User, Depends(get_current_active_user)]
):
    return current_user

class Article(BaseModel):
    id : int
    title: str
    description: str
    date : str
    thumbnail: str
    icon : str
    icon_color : str
    importance : int
    wiki_link : str
        
@app.post("/articles")
async def get_articles():
    cursor = users_db.cursor()
    cursor.execute("SELECT * FROM articles")
    articles = cursor.fetchall()
    return articles

@app.post("/articles/add")
async def add_article(title, description, date, thumbnail, icon, icon_color, importance, wiki_link, current_user: Annotated[User, Depends(get_current_active_user)]):
	if not current_user.is_admin:
		return {"error": "You are not an admin"}
	cursor = users_db.cursor()
	cursor.execute("INSERT INTO articles VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?)", (title, description, date, thumbnail, icon, icon_color, importance, wiki_link))
	users_db.commit()
	return {"success": "Article added"}

@app.post("/articles/delete")
async def delete_article(id: int, current_user: Annotated[User, Depends(get_current_active_user)]):
    if not current_user.is_admin:
        return {"error": "You are not an admin"}
    cursor = users_db.cursor()
    cursor.execute("DELETE FROM articles WHERE id = ?", (id,))
    users_db.commit()
    return {"success": "Article deleted"}


if __name__ == "__main__":
    #setup db if not setup
    cursor = users_db.cursor()
    cursor.execute("CREATE TABLE IF NOT EXISTS users (username TEXT, email TEXT, full_name TEXT, hashed_password TEXT, is_admin INTEGER DEFAULT 0)")
    cursor.execute("CREATE TABLE IF NOT EXISTS articles (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, description TEXT, date TEXT, thumbnail TEXT, icon TEXT, icon_color TEXT, importance INTEGER, wiki_link TEXT)")
    users_db.commit()


    uvicorn.run(app,)
        
    #as a test, add these articles to the db
#     {
# 	"events": [
# 		{
# 			"title": "Never",
# 			"description": "hello wor- fuck you",
# 			"date": "2022-01-01",
# 			"thumbnail": "https://tr-werkzeuge.de/wp-content/uploads/2019/10/neue-website.jpeg",
# 			"icon": "idk",
# 			"icon-color": "#ffffff",
# 			"importance": "3",
# 			"wiki-link": "https://en.wikipedia.org/wiki/New_Year's_Day"
# 		},
# 		{
# 			"title": "Gonna",
# 			"description": "Your dad wont come back bruh",
# 			"date": "2022-02-01",
# 			"thumbnail": "https://s3.theasianparent.com/cdn-cgi/image/width=700,quality=95/tap-assets-prod/wp-content/uploads/sites/12/2018/01/dad-leaves-.jpg",
# 			"icon": "idk",
# 			"icon-color": "#ffffff",
# 			"importance": "2",
# 			"wiki-link": "https://en.wikipedia.org/wiki/New_Year's_Day"
# 		},
# 		{
# 			"title": "Give",
# 			"description": "your mom is fat",
# 			"date": "2022-02-03",
# 			"thumbnail": "https://free-funny-jokes.com/funny-pictures/yo-mama-so-fat-jokes.webp",
# 			"icon": "idk",
# 			"icon-color": "#ffffff",
# 			"importance": "1",
# 			"wiki-link": "https://en.wikipedia.org/wiki/New_Year's_Day"
# 		},
# 		{
# 			"title": "You",
# 			"description": "lorem ipsum whatever",
# 			"date": "2022-08-05",
# 			"thumbnail": "https://assets.justinmind.com/wp-content/webp-express/webp-images/uploads/2018/11/Lorem-Ipsum-alternatives-768x492.png.webp",
# 			"icon": "idk",
# 			"icon-color": "#ffffff",
# 			"importance": "2",
# 			"wiki-link": "https://en.wikipedia.org/wiki/New_Year's_Day"
# 		},
# 		{
# 			"title": "Up",
# 			"description": "The start of the new year.",
# 			"date": "2023-01-01",
# 			"thumbnail": "https://mamasgeeky.com/wp-content/uploads/2019/12/new-years-eve-meme-1.jpg",
# 			"icon": "idk",
# 			"icon-color": "#ffffff",
# 			"importance": "3",
# 			"wiki-link": "https://en.wikipedia.org/wiki/New_Year's_Day"
# 		}
# 	]
# }