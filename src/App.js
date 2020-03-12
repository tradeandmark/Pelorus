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
          width: "400px",
          margin: "0 auto",
          textAlign: "center",
          color: "#FFF"
        }
      }}
      gap={15}
    >
      <Text variant="xxLarge" styles={boldStyle}>
        Hello World!
      </Text>
      <Text variant="large">Welcome to your epic electron + react app!</Text>
    </Stack>
  );
}

export default App;
