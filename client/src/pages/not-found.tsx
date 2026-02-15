import { Tile, Button } from "@carbon/react";
import { ErrorFilled } from "@carbon/icons-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "2rem" }}>
      <Tile style={{ maxWidth: "28rem", textAlign: "center", padding: "2rem" }}>
        <ErrorFilled size={32} style={{ color: "#da1e28", marginBottom: "1rem" }} />
        <h2 style={{ marginBottom: "0.5rem" }}>404 Page Not Found</h2>
        <p style={{ fontSize: "0.875rem", opacity: 0.7, marginBottom: "1rem" }}>
          The page you're looking for doesn't exist.
        </p>
        <Link href="/">
          <Button kind="primary" data-testid="button-go-home">Go to Dashboard</Button>
        </Link>
      </Tile>
    </div>
  );
}
