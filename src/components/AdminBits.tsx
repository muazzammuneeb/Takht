"use client";

import { useActionState, useState } from "react";
import { adminLogin, type FormState } from "@/app/actions";

export function CopyButton({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="btn btn-ghost btn-sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          // Older browsers / non-secure contexts.
          const ta = document.createElement("textarea");
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          ta.remove();
        }
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
    >
      {done ? "Copied ✓" : label}
    </button>
  );
}

export function LoginForm() {
  const [state, action] = useActionState<FormState, FormData>(adminLogin, {});
  return (
    <form action={action} className="panel" style={{ maxWidth: 420 }}>
      <h1>Admin</h1>
      {state.error && (
        <p className="error" role="alert">
          {state.error}
        </p>
      )}
      <div className="field">
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" />
      </div>
      <button className="btn btn-block">Log in</button>
    </form>
  );
}
