import React from "react";
import { Stack, Text, FontWeights } from "office-ui-fabric-react";

const boldStyle = { root: { fontWeight: FontWeights.semibold } };

function App() {
  return (
    <Stack
      horizontalAlign="center"
      verticalAlign="center"
      verticalFill
      styles={{
        root: {
          width: "100vw",
          height: "100vh",
          margin: "0 auto",
          color: "#FFF",
        },
      }}
    >
      <Text variant="xxLarge" styles={boldStyle}>
        Hello World!
      </Text>
    </Stack>
  );
}

export default App;
