import { useState } from "react";
import Header from "./components/header";
import BikesList from "./components/bikeslist";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

function App() {
  const [count, setCount] = useState(0);
  const queryClient = new QueryClient();
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <Header />
        <BikesList />
      </QueryClientProvider>
    </>
  );
}

export default App;
