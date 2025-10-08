import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Callback() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (!code) {
      navigate("/login");
      return;
    }

    const codeVerifier = localStorage.getItem("spotify_code_verifier");

    const body = new URLSearchParams({
      client_id: "ddf0c76f108e48229461ed6a31574a9f",
      grant_type: "authorization_code",
      code,
      redirect_uri: "http://127.0.0.1:5173/callback",
      code_verifier: codeVerifier,
    });

    fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Spotify token response: ",data);
        if (data.access_token) {
          localStorage.setItem("spotify_access_token", data.access_token);
          navigate("/home");
        } else {
          console.error("Token exchange failed:", data, "Body sent:", body.toString());
          navigate("/login");
        }
      })
      .catch((err) => {
        console.error("Error exchanging code:", err);
        navigate("/login");
      });
  }, [navigate]);

  return <p>Logging you in...</p>;
}

export default Callback;
