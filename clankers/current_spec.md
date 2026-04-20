# SillyLite Specification (Current)

Lightweight chat UI to cover the core 80% of SillyTavern and related

## 1. Filesystem Organization

All application data is stored in a `data` directory relative to the executable/server root. The structure follows a character-centric hierarchy to simplify management and portability.

```text
/data
  /characters
    /__system__                # Reserved ID for orphaned chats
      /character.json
      /chats
        /global_chat_1.json
    /{character_uuid}          # Character directory
      /character.json          # Character metadata and globals
      /avatar.png              # Character image
      /chats                   # Sub-directory for all chats with this char
        /{chat_uuid}.json
  /config.json                 # Adapters and general settings
```

## 2. Data Schema

### Character
Characters are the primary organizational unit of chats.

```ts
interface Character {
  id: string                  // uuid, directory name on disk
  name: string
  globals: Globals            // default template variables for this character
  avatar?: string             // filename within character directory
  created_at: number          // unix ms
  modified_at: number
  metadata?: Record<string, unknown>  // raw data from v2/v3 imports
}
```

### Chat
A chat is a single JSON file containing the full conversation history.

```ts
interface Chat {
  id: string                  // uuid, filename: <id>.json
  character_id: string        // foreign key → Character.id
  title?: string
  globals: Globals            // chat-local overrides (merged with character globals)
  messages: Message[]
  fork_of?: {
    chat_id: string
    message_index: number
  }
  created_at: number
  modified_at: number
}
```

### Message & Swipe
Messages represent turns in the conversation. AI turns support multiple "swipes" (variations).

```ts
interface Message {
  id: string                  // uuid, stable across edits and moves
  role: "user" | "assistant" | "system"
  name?: string               // display name override
  content: string             // active content (mirrors swipes[swipe_index].text)
  swipes?: Swipe[]            // variations (assistant only)
  swipe_index?: number        // current active variation index
  modified_at: number
  extra?: Record<string, unknown> // arbitrary data for the formatter
}

interface Swipe {
  text: string
  created_at: number
  model?: string
  api?: string
  extra?: Record<string, unknown>
}
```

### Globals
Flat key-value maps used for template injection. Character-level globals are shallow-merged under chat-level globals (chat wins on collision).
```ts
type Globals = Record<string, string | number | boolean | null>
```

## 3. Core Features

### Execution Pipeline
`[internal chat format] -> [formatter] -> [templated text/blocks] -> [language model] -> [parser] -> [UI]`

- **Formatter**: Applies Jinja2-style templating using `globals`. Supports whitespace trimming, prefix/affix insertion, and message concatenation.
- **Custom Formatters**: Users can provide a Javascript file to override the default formatting logic.

### Chat Management
- **Swiping**: Regenerating the last AI response. This adds a new entry to the `swipes` array and updates the `content` field.
- **Forking**: Creating a new chat from a specific message index. The new chat is saved as a separate file in the same character's `chats` folder.
- **Manipulation**: Full CRUD on messages, including drag-and-drop reordering.

### Import Support
- **Character Card V2/V3**: Full support for PNG/APNG metadata chunks.
- **SillyTavern JSONL**: Importer for legacy chat logs, converting them into the single-file JSON `Chat` format.

## 4. Adapters (Language Models)

Adapters handle the communication with external APIs.

```ts
interface LMAdapter {
  id: string
  label: string
  type: "openai" | "anthropic" | "echo" | "custom"
  config: Record<string, any> // endpoints, keys, sampler settings
  complete(chat: Chat, signal: AbortSignal): AsyncIterable<string>
}
```

- **EchoAdapter**: Streams the formatted input back to the user for debugging.
- **OpenAI Adapter**: Standard chat completion format.

## 5. UI/UX Style
- **Markdown Rendering**: All message contents rendered via markdown.
- **Dialogue Highlighting**: Optional regex-based highlighting for quoted text.
- **Mobile-First**: Responsive layout with a focus on vertical readability.
- **No Bloat**: Avoids complex "world info" or "lorebook" management unless explicitly required by a minimal character spec.

## 6. Invariants
- `Character.id === "__system__"` is reserved for chats not associated with a specific character.
- Updating `swipe_index` in a `Message` must immediately update the `content` field to maintain synchronization.
- The formatter must receive a deep copy of the `Chat` to prevent accidental mutation of the persistence layer.

---

### Import Reference: Character Card V3

Embedded in PNG `ccv3` chunk (base64 encoded JSON).

```typescript
interface CharacterCardV3 {
  spec: 'chara_card_v3'
  spec_version: '3.0'
  data: {
    name: string
    description: string
    tags: Array<string>
    creator: string
    character_version: string
    mes_example: string
    extensions: Record<string, any>
    system_prompt: string
    post_history_instructions: string
    first_mes: string
    alternate_greetings: Array<string>
    personality: string
    scenario: string
    creator_notes: string
    character_book?: any
    assets?: Array<{ type: string; uri: string; name: string; ext: string }>
    nickname?: string
    group_only_greetings: Array<string>
    creation_date?: number
    modification_date?: number
  }
}
```

### Import Reference: SillyTavern JSONL

Consists of three object types:
1. **Metadata Header**: `{"user_name": "...", "character_name": "...", "chat_metadata": {...}}`
2. **Standard Message**: `{"name": "...", "is_user": true, "mes": "...", ...}`
3. **Swipe Message**: `{"name": "...", "swipes": ["v1", "v2"], "swipe_id": 0, ...}`