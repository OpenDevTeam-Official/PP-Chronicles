from datetime import datetime, timedelta
import re
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
optional_oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token", auto_error=False)

app = FastAPI()


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    return pwd_context.hash(password)


def get_user(username: str):
	cursor = users_db.cursor()
	cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
	user = cursor.fetchone()
	if user:
		return User(username=user[0], email=user[1], full_name=user[2], is_admin=user[4])


def authenticate_user(username: str, password: str):
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

async def get_current_user_or_none(token: Annotated[str, Depends(optional_oauth2_scheme)]):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            return None
        token_data = TokenData(username=username)
    except:
        return None
    user = get_user(username=token_data.username)
    if user is None:
        return None
    return user

async def get_current_active_user(
    current_user: Annotated[User, Depends(get_current_user)]
):
    return current_user

async def get_current_active_user_optional_auth(
    #this is the same as get_current_active_user but it doesn't send an error if the user is not authenticated
    current_user: Annotated[User, Depends(get_current_user_or_none)]
):
    return current_user if current_user else None


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
    #ignore capitalization when checking if username is taken
    #get all users
    cursor.execute("SELECT * FROM users")
    users = cursor.fetchall()
    #check if username is taken
    user = None
    for u in users:
        if u[0].lower() == username.lower():
            user = u
            break
    if user:
        return {"error": "Username already taken"}
    else:
        try: 
            if len(password) < 8:
                return {"error": "Password must be at least 8 characters long"}
            if len(username) > 20:
                return {"error": "Username must be at most 20 characters long"}
            if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
                return {"error": "Invalid email"}
            cursor.execute("INSERT INTO users VALUES (?, ?, ?, ?, ?)", (username, email, full_name, get_password_hash(password), False))
            users_db.commit()
            return {"success": "User created"}
        except:
            return {"error": "Something went wrong, please contact Almos or Simon for help. Your custom client may be misbehaving."}
        
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
async def get_articles(current_user = Depends(get_current_active_user_optional_auth)):
    # cursor = users_db.cursor()
    # cursor.execute("SELECT * FROM articles")
    # articles = cursor.fetchall()
    # return articles
    
    cursor = users_db.cursor()
    cursor.execute("SELECT * FROM articles")
    articles = cursor.fetchall()
    if current_user:
        if current_user.is_admin:
            return articles
        else:
            return [article for article in articles if datetime.strptime(article[3], "%Y-%m-%d").date() <= datetime.today().date()]
    else:
        return [article for article in articles if datetime.strptime(article[3], "%Y-%m-%d").date() <= datetime.today().date()]

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

class SubmittedArticle(BaseModel):
    id : int
    title: str
    description: str
    date : str
    thumbnail: str
    icon : str
    icon_color : str
    importance : int
    wiki_link : str
    submitter : str
    submitStatus : str

@app.post("/articles/submit")
async def submit_article(title, description, date, thumbnail, icon, icon_color, importance, wiki_link, current_user: Annotated[User, Depends(get_current_active_user)]):
    # a user may have only 5 pending articles at a time
    if not current_user.is_admin:
        cursor = users_db.cursor()
        cursor.execute("SELECT * FROM submissions WHERE submitter = ? AND submitStatus = ?", (current_user.username, "pending"))
        articles = cursor.fetchall()
        if len(articles) >= 5:
            return {"error": "You have too many pending articles. You can only have 5 pending articles at a time. Please wait for your articles to be reviewed before submitting more."}

    cursor = users_db.cursor()
    cursor.execute("INSERT INTO submissions VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", (title, description, date, thumbnail, icon, icon_color, importance, wiki_link, current_user.username, "pending"))
    users_db.commit()
    return {"success": "Article submitted for review"}

@app.post("/articles/submissions")
async def get_submissions(current_user: Annotated[User, Depends(get_current_active_user)]):
    if not current_user.is_admin:
        return {"error": "You are not an admin"}
    cursor = users_db.cursor()
    cursor.execute("SELECT * FROM submissions")
    submissions = cursor.fetchall()
    return submissions

@app.post("/articles/submissions/approve")
async def approve_submission(id: int, current_user: Annotated[User, Depends(get_current_active_user)]):
    if not current_user.is_admin:
        return {"error": "You are not an admin"}
    cursor = users_db.cursor()
    cursor.execute("SELECT * FROM submissions WHERE id = ?", (id,))
    submission = cursor.fetchone()
    cursor.execute("INSERT INTO articles VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?)", (submission[1], submission[2], submission[3], submission[4], submission[5], submission[6], submission[7], submission[8]))
    #mark submission as approved
    cursor.execute("UPDATE submissions SET submitStatus = ? WHERE id = ?", ("approved", id))
    users_db.commit()
    return {"success": "Submission approved"}

@app.post("/articles/submissions/reject")
async def reject_submission(id: int, current_user: Annotated[User, Depends(get_current_active_user)]):
    if not current_user.is_admin:
        return {"error": "You are not an admin"}
    cursor = users_db.cursor()
    #mark submission as rejected
    cursor.execute("UPDATE submissions SET submitStatus = ? WHERE id = ?", ("rejected", id))
    users_db.commit()
    return {"success": "Submission rejected"}

@app.post("/articles/submissions/markforimprovement")
async def mark_for_improvement(id: int, current_user: Annotated[User, Depends(get_current_active_user)]):
    if not current_user.is_admin:
        return {"error": "You are not an admin"}
    cursor = users_db.cursor()
    #mark submission as rejected
    cursor.execute("UPDATE submissions SET submitStatus = ? WHERE id = ?", ("improvement needed", id))
    users_db.commit()
    return {"success": "Submission marked for improvement."}


@app.post("/articles/submissions/edit")
async def edit_submission(id: int, title, description, date, thumbnail, icon, icon_color, importance, wiki_link, current_user: Annotated[User, Depends(get_current_active_user)]):
    #a user can only edit their own submissions, and only if they have been marked for improvement
    if not current_user.is_admin:
        cursor = users_db.cursor()
        cursor.execute("SELECT * FROM submissions WHERE id = ?", (id,))
        submission = cursor.fetchone()
        if submission[9] != current_user.username:
            return {"error": "You can only edit your own submissions"}
        if submission[10] != "improvement needed":
            return {"error": "You can only edit submissions that have been marked for improvement"}
        cursor.execute("UPDATE submissions SET title = ?, description = ?, date = ?, thumbnail = ?, icon = ?, icon_color = ?, importance = ?, wiki_link = ? WHERE id = ?", (title, description, date, thumbnail, icon, icon_color, importance, wiki_link, id))
        users_db.commit()
        return {"success": "Submission edited"}
    else:
        cursor = users_db.cursor()
        cursor.execute("UPDATE submissions SET title = ?, description = ?, date = ?, thumbnail = ?, icon = ?, icon_color = ?, importance = ?, wiki_link = ? WHERE id = ?", (title, description, date, thumbnail, icon, icon_color, importance, wiki_link, id))
        users_db.commit()
        return {"success": "Submission edited"}


    
if __name__ == "__main__":
    #setup db if not setup
    cursor = users_db.cursor()
    cursor.execute("CREATE TABLE IF NOT EXISTS users (username TEXT, email TEXT, full_name TEXT, hashed_password TEXT, is_admin INTEGER DEFAULT 0)")
    cursor.execute("CREATE TABLE IF NOT EXISTS articles (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, description TEXT, date TEXT, thumbnail TEXT, icon TEXT, icon_color TEXT, importance INTEGER, wiki_link TEXT)")
    cursor.execute("CREATE TABLE IF NOT EXISTS submissions (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, description TEXT, date TEXT, thumbnail TEXT, icon TEXT, icon_color TEXT, importance INTEGER, wiki_link TEXT, submitter TEXT, submitStatus TEXT)")
    users_db.commit()


    uvicorn.run(app,)
        