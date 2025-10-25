import React from "react";
import type { ReactElement } from "react";
import { createRoot } from "react-dom/client";
import SoundAnalyzerPage from "./page";

// If this file is executed in a non-Next (client) environment where an HTML
// element with id="root" exists, mount the SoundAnalyzer app into it. Otherwise
// export the component so the Next.js app/router can import it as needed.
const mountIfNeeded = (): void => {
	if (typeof document === "undefined") return;
	const rootEl = document.getElementById("root");
	if (!rootEl) return;
	const root = createRoot(rootEl);
	root.render(
		<React.StrictMode>
			<SoundAnalyzerPage />
		</React.StrictMode>
	);
};

try {
	mountIfNeeded();
} catch (err) {
	// Fail silently — mounting is optional and only used in non-Next dev setups.
	// Keep export below so the module remains usable programmatically.
	console.warn("SoundAnalyzer standalone mount failed:", err);
}

export default function App(): ReactElement {
	return <SoundAnalyzerPage />;
}

