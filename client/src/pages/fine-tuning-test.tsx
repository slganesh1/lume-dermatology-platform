import { useEffect } from "react";

export default function FineTuningTest() {
  useEffect(() => {
    // Redirect to the fixed fine-tuning test admin page
    window.location.href = "/api/fine-tuning/test/test-page";
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Redirecting to Fine-Tuning Test Page...</h1>
        <p>If you are not redirected automatically, <a href="/api/fine-tuning/test/test-page" className="text-blue-600 underline">click here</a>.</p>
      </div>
    </div>
  );
}