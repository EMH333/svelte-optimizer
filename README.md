The goal of this project is to extract all the properties of Svelte compontents that are used by a piece of code, then set all exposed (except needed internal to component or otherwise) that aren't needed to be constant to reduce bundle size

Essentially targeted/profile-guided dead code elimination
