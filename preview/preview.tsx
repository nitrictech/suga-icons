import { useState } from "react";
import { createRoot } from "react-dom/client";
import { catalog } from "../src/catalog";

const icons = Object.entries(catalog);

function Gallery() {
  const [query, setQuery] = useState("");
  const shown = icons.filter(([name]) =>
    name.toLowerCase().includes(query.trim().toLowerCase()),
  );
  return (
    <>
      <p>{`${icons.length} icons, each at 16px (its real size) and 32px.`}</p>
      <input
        type="search"
        placeholder="Find an icon"
        aria-label="Find an icon"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <main>
        {shown.map(([name, Icon]) => (
          <figure key={name}>
            <div className="sizes">
              <Icon />
              <Icon className="large" />
            </div>
            <figcaption>{name}</figcaption>
          </figure>
        ))}
      </main>
    </>
  );
}

const root = document.getElementById("root");
if (root) createRoot(root).render(<Gallery />);
