
export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-xl">
        <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
        <p className="text-slate-500 mb-8">Sign in to continue</p>

        <div className="space-y-5">
          <input
            placeholder="Email"
            className="w-full border border-slate-200 rounded-2xl p-4"
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full border border-slate-200 rounded-2xl p-4"
          />

          <button className="w-full bg-blue-600 text-white p-4 rounded-2xl">
            Login
          </button>
        </div>
      </div>
    </div>
  );
}
