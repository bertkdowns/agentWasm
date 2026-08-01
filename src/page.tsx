// app/page.tsx

import { Renderer, StateProvider, ActionProvider, VisibilityProvider, ValidationProvider, useUIStream } from '@json-render/react';
import { registry } from '@/lib/registry';

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
    }

  return (
    <StateProvider initialState={{}}>
      <VisibilityProvider>
        <ActionProvider handlers={{
          submit: (params) => console.log('Submit:', params),
          navigate: (params) => console.log('Navigate:', params),
        }}>
          <ValidationProvider customFunctions={{}}>

            <div className="mt-8">
              <Renderer spec={spec} registry={registry}/>
            </div>
          </ValidationProvider>
        </ActionProvider>
      </VisibilityProvider>
    </StateProvider>
  );
}