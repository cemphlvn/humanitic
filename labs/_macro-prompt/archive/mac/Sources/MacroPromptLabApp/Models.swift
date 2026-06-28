import Foundation

struct LoopReport: Decodable {
    let engine: String
    let fragmentCount: Int
    let rejected: [RejectedResult]
    let kept: [KeptResult]
    let dropped: [DroppedResult]
}

struct KeptResult: Decodable, Identifiable {
    let snippet: Snippet
    let placement: Placement
    let score: GoalScore
    let saved: Bool

    var id: String { snippet.id }
}

struct DroppedResult: Decodable, Identifiable {
    let snippet: Snippet
    let placement: Placement
    let score: GoalScore

    var id: String { snippet.id }
}

struct RejectedResult: Decodable, Identifiable {
    let fragment: String
    let verdict: GateVerdict

    var id: String { "\(verdict.failedAssumption ?? "unknown")-\(fragment.hashValue)" }
}

struct Snippet: Decodable, Identifiable {
    enum Kind: String, Decodable {
        case concept
        case intent
    }

    let id: String
    let kind: Kind
    let gloss: String
    let move: String?
    let tags: [String]
    let source: String
    let createdAt: String
}

struct Placement: Decodable {
    let relation: String
    let nearestId: String?
    let nearestScore: Double
    let neighbors: [Neighbor]
}

struct Neighbor: Decodable, Identifiable {
    let id: String
    let score: Double
}

struct GoalScore: Decodable {
    let keep: Bool
    let score: Double
    let why: String
}

struct GateVerdict: Decodable {
    let pass: Bool
    let failedAssumption: String?
    let reason: String
}

struct LocalModelsReport: Decodable {
    let mlxRuntime: MlxRuntimeStatus
    let models: [LocalModelCandidate]
}

struct MlxRuntimeStatus: Decodable {
    let commandFound: Bool
    let usable: Bool
    let command: String?
    let error: String?
}

struct LocalModelCandidate: Decodable, Identifiable {
    let provider: String
    let name: String
    let path: String
    let runnable: Bool
    let generative: Bool
    let note: String

    var id: String { "\(provider):\(path)" }
}

struct HighlightAnnotation: Identifiable {
    enum Label: String {
        case userMagic = "user-magic"
        case candidate
        case rejected
        case kept
    }

    let id: String
    let label: Label
    let note: String?
}
