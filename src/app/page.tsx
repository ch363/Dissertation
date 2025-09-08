export default function HomePage() {
  return (
    <main style={{ padding: 24 }}>
      <h1>{process.env.NEXT_PUBLIC_APP_NAME || 'Dissertation'}</h1>
      <p>Welcome! Your Next.js + TypeScript app is ready.</p>
      <ul>
        <li>
          Health check API: <a href="/api/health">/api/health</a>
        </li>
      </ul>
    </main>
  );
}
