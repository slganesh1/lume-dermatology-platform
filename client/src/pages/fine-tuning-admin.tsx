import { useEffect } from "react";

export default function FineTuningAdmin() {
  useEffect(() => {
    // Redirect to the fine-tuning admin page
    window.location.href = "/api/fine-tuning/admin-page";
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Redirecting to Fine-Tuning Admin...</h1>
        <p>If you are not redirected automatically, <a href="/api/fine-tuning/admin-page" className="text-blue-600 underline">click here</a>.</p>
      </div>
    </div>
  );
}