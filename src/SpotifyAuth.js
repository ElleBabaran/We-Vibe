const CLIENT_ID="ddf0c76f108e48229461ed6a31574a9f";
const REDIRECT_URI= "http://127.0.0.1:5173/callback";
const AUTH_ENDPOINT= "https://accounts.spotify.com/authorize";
const RESPONSE_TYPE="token";

const SCOPES =[
  "user-read-private",
  "user-read-email",
  "playlist-read-private",
  "playlist-modify-private"
].join("%20");

export const loginUrl = `${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=${SCOPES}&response_type=${RESPONSE_TYPE}&show_dialog=true`;