import AppKit
import Foundation

@MainActor
final class AppState: ObservableObject {
    enum RunMode {
        case experiment
        case learn

        var command: String {
            switch self {
            case .experiment: "experiment"
            case .learn: "learn"
            }
        }
    }

    @Published var promptText: String = ""
    @Published var highlights: [HighlightAnnotation] = []
    @Published var selectedSnippetID: String?
    @Published var selectedSidebar: SidebarSection = .concepts
    @Published var selectedEngine: EngineChoice = .heuristic
    @Published var report: LoopReport?
    @Published var isRunning = false
    @Published var status = "Ready"
    @Published var errorMessage: String?
    @Published var sharePreview: String?
    @Published var localModels: [LocalModelCandidate] = []
    @Published var modelStatus = "Local models not scanned yet"
    @Published var mlxRuntime: MlxRuntimeStatus?
    @Published var showAdvancedRuntime = false

    let loopRunner = LoopRunner()

    var conceptResults: [KeptResult] {
        report?.kept.filter { $0.snippet.kind == .concept } ?? []
    }

    var intentResults: [KeptResult] {
        report?.kept.filter { $0.snippet.kind == .intent } ?? []
    }

    var selectedSnippet: Snippet? {
        guard let selectedSnippetID else { return nil }
        return report?.kept.first(where: { $0.snippet.id == selectedSnippetID })?.snippet
    }

    func run(_ mode: RunMode) async {
        let trimmed = promptText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else {
            status = "Paste text before running the lens."
            return
        }

        isRunning = true
        errorMessage = nil
        status = mode == .learn ? "Learning into the private library..." : "Running dry experiment..."

        do {
            let nextReport = try await loopRunner.run(command: mode.command, text: trimmed, engine: selectedEngine.rawValue)
            report = nextReport
            selectedSnippetID = nextReport.kept.first?.snippet.id
            selectedSidebar = nextReport.kept.contains(where: { $0.snippet.kind == .concept }) ? .concepts : .rejected
            status = "\(nextReport.kept.count) kept, \(nextReport.dropped.count) dropped, \(nextReport.rejected.count) rejected"
        } catch {
            errorMessage = error.localizedDescription
            status = "Run failed"
        }

        isRunning = false
    }

    func markCurrentSelectionAsHighlight() {
        let annotation = HighlightAnnotation(
            id: UUID().uuidString,
            label: .userMagic,
            note: "User-marked prompt magic"
        )
        highlights.append(annotation)
        status = "Highlight noted locally. Span selection will be wired in the AppKit editor pass."
    }

    func loadSamplePrompt() {
        promptText = SamplePrompt.text
        status = "Sample loaded. Click Experiment to preview what the lens extracts."
    }

    func pasteFromClipboard() {
        guard let text = NSPasteboard.general.string(forType: .string), !text.isEmpty else {
            status = "Clipboard has no text to paste."
            return
        }
        promptText = text
        status = "Clipboard text pasted. Click Experiment to preview."
    }

    func clearPrompt() {
        promptText = ""
        report = nil
        selectedSnippetID = nil
        status = "Cleared. Paste or type text to begin."
    }

    func contributeSelectedSnippet() async {
        guard let selectedSnippetID else {
            status = "Select a snippet before contributing."
            return
        }

        isRunning = true
        errorMessage = nil
        status = "Composing de-identified share..."

        do {
            sharePreview = try await loopRunner.contribute(id: selectedSnippetID)
            status = "Share composer returned a guarded contribution."
        } catch {
            errorMessage = error.localizedDescription
            status = "Contribution failed"
        }

        isRunning = false
    }

    func scanLocalModels() async {
        do {
            let report = try await loopRunner.localModels()
            localModels = report.models
            mlxRuntime = report.mlxRuntime
            let runtimeLabel = report.mlxRuntime.usable
                ? "usable"
                : report.mlxRuntime.commandFound ? "found but not usable" : "not found"
            modelStatus = report.models.isEmpty
                ? "No local model candidates found; MLX runtime \(runtimeLabel)"
                : "\(report.models.count) local model candidate(s) found; MLX runtime \(runtimeLabel)"
        } catch {
            modelStatus = "Local model scan failed: \(error.localizedDescription)"
        }
    }
}

enum SidebarSection: String, CaseIterable, Identifiable {
    case concepts = "Review"
    case intents = "Reasoning Moves"
    case ontology = "Ontology"
    case rejected = "Rejected"

    var id: String { rawValue }
}

enum EngineChoice: String, CaseIterable, Identifiable {
    case heuristic
    case mlx
    case claude

    var id: String { rawValue }

    var label: String {
        switch self {
        case .heuristic: "Heuristic"
        case .mlx: "MLX"
        case .claude: "Claude"
        }
    }
}

enum SamplePrompt {
    static let text = """
    Before answering, identify the hidden assumption in the user's framing.
    Compare multiple possible interpretations before choosing the most useful one.
    Prefer grounded mechanisms over vague explanations so the output can be tested.
    Only modularize things that have different reasons to change.
    Separate user intent, hidden assumptions, and risk when the topic touches safety or alignment.
    """
}
