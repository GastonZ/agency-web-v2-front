import { GoogleLogin } from "@react-oauth/google";
import type { CredentialResponse } from "@react-oauth/google";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TOKEN_KEY } from "../../utils/helper";
import { googleLogin } from "../../services/client";
import { toast } from "react-toastify";

export default function GoogleSignInButton() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSuccess = async (cred: CredentialResponse) => {
    try {
      setLoading(true);
      const idToken = cred.credential;
      if (!idToken) throw new Error("No Google credential received.");

      const res = await googleLogin(idToken);

      if (!res.active) {
        toast("Your account is not active yet.");
        return;
      }

      localStorage.setItem(TOKEN_KEY, res.token);
      localStorage.setItem("user_id", res.userId);
      localStorage.setItem("user_email", res.email);

      navigate("/");
    } catch (e: any) {
      console.error(e);
      toast(e?.message ?? "Google login failed");
    } finally {
      setLoading(false);
    }
  };

  const onError = () => {
    toast.error("Google login was cancelled or failed.");
  };

  return (
    <div>
      <GoogleLogin onSuccess={onSuccess} onError={onError} />
      {loading && <p>Signing you in…</p>}
    </div>
  );
}
