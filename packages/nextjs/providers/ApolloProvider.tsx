"use client";

import { ReactNode } from "react";
import { ApolloClient, ApolloProvider as BaseApolloProvider, InMemoryCache } from "@apollo/client";

const client = new ApolloClient({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || "http://localhost:8080/v1/graphql",
  cache: new InMemoryCache(),
});

export function ApolloProvider({ children }: { children: ReactNode }) {
  return <BaseApolloProvider client={client}>{children}</BaseApolloProvider>;
}
