// app/page.tsx

import {
  Renderer,
  JSONUIProvider,
} from "@json-render/react";
import { registry } from "@/lib/registry";

export default function Page() {
  const spec = {
    root: "btn",
    elements: {
      btn: {
        type: "Button",
        props: { label: "Click me", variant: "primary" },
        on: { press: { action: "confetti" } },
      },
    },
  };

  return (
    <JSONUIProvider
    registry={registry}
    initialState={{}}
    handlers={{
            submit: (params) => console.log("Submit:", params),
            navigate: (params) => console.log("Navigate:", params),
            confetti: (params) => console.log("Confetti action triggered!", params),
          }}
    >
      <div className="mt-8">
        <Renderer spec={spec} registry={registry} />
      </div>
    </JSONUIProvider>
  );
}
