from flask import Flask, jsonify, redirect, url_for, session
from authlib.integrations.flask_client import OAuth
import os

app = Flask(__name__)
app.secret_key = os.urandom(24)  # Use a secure random key in production
oauth = OAuth(app)

oauth.register(
  name='oidc',
  authority='https://cognito-idp.ap-southeast-2.amazonaws.com/ap-southeast-2_BXhdoWuDl',
  client_id='4r2ui82gb5gigfrfjl18tq1i6i',
  client_secret='h1bsjhhc0skjr9leug1tkru3upe4s1hsqj01qnbplhc2k6819c2',
  server_metadata_url='https://cognito-idp.ap-southeast-2.amazonaws.com/ap-southeast-2_BXhdoWuDl/.well-known/openid-configuration',
  client_kwargs={'scope': 'phone openid email'}
)


@app.route('/')
def index():
    user = session.get('user')
    if user:
        return  f'Hello, {user["email"]}. <a href="/logout">Logout</a>'
    else:
        return f'Welcome! Please <a href="/login">Login</a>.'
    
@app.route('/login')
def login():
    # Alternate option to redirect to /authorize
    # redirect_uri = url_for('authorize', _external=True)
    # return oauth.oidc.authorize_redirect(redirect_uri)
    return oauth.oidc.authorize_redirect('https://d84l1y8p4kdic.cloudfront.net')
    
@app.route('/authorize')
def authorize():
    token = oauth.oidc.authorize_access_token()
    user = token['userinfo']
    session['user'] = user
    return redirect(url_for('index'))

@app.route('/logout')
def logout():
    session.pop('user', None)
    return redirect(url_for('index'))


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=False)






