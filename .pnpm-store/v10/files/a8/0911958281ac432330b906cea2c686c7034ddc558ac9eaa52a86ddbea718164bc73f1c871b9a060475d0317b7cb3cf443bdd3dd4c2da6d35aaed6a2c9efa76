// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

export interface Commit {
  repo: Commit.Repo;

  sha: string;
}

export namespace Commit {
  export interface Repo {
    branch: string;

    name: string;

    owner: string;
  }
}

export type FileInput = FileInput.Content | FileInput.URL;

export namespace FileInput {
  export interface Content {
    /**
     * File content
     */
    content: string;
  }

  export interface URL {
    /**
     * URL to fetch file content from
     */
    url: string;
  }
}

export type Target =
  | 'node'
  | 'typescript'
  | 'python'
  | 'go'
  | 'java'
  | 'kotlin'
  | 'ruby'
  | 'terraform'
  | 'cli'
  | 'php'
  | 'csharp';
