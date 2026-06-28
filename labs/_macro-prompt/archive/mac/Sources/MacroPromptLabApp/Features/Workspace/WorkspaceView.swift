import SwiftUI

struct WorkspaceView: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        HSplitView {
            PromptColumn()
                .frame(minWidth: 460, idealWidth: 620)

            ResultsColumn()
                .frame(minWidth: 560)
        }
        .background(LabColor.background)
    }
}

private struct PromptColumn: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            StartHerePanel()

            HStack(alignment: .firstTextBaseline) {
                Text("Your Text")
                    .font(.title3.weight(.semibold))
                Spacer()
                Button {
                    appState.pasteFromClipboard()
                } label: {
                    Label("Paste", systemImage: "doc.on.clipboard")
                }
                Button {
                    appState.loadSamplePrompt()
                } label: {
                    Label("Sample", systemImage: "text.page")
                }
                Button {
                    appState.clearPrompt()
                } label: {
                    Label("Clear", systemImage: "xmark.circle")
                }
                Button {
                    appState.markCurrentSelectionAsHighlight()
                } label: {
                    Label("Mark", systemImage: "highlighter")
                }
                .help("Mark selected text as user-identified prompt magic")
            }

            if appState.promptText.isEmpty {
                Text("Click in the editor and type, or use Paste / Sample above.")
                    .font(.callout)
                    .foregroundStyle(.secondary)
            }

            TextEditor(text: $appState.promptText)
                .font(.system(.body, design: .monospaced))
                .scrollContentBackground(.hidden)
                .padding(10)
                .background(Color(nsColor: .textBackgroundColor))
                .clipShape(RoundedRectangle(cornerRadius: 8))
                .overlay(RoundedRectangle(cornerRadius: 8).stroke(LabColor.border))

            if !appState.highlights.isEmpty {
                LabSection(title: "Marked Passages") {
                    ForEach(appState.highlights) { highlight in
                        HStack {
                            Image(systemName: "highlighter")
                            Text(highlight.note ?? highlight.label.rawValue)
                            Spacer()
                            Text(highlight.label.rawValue)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }
                }
            }

            LocalModelPanel()
            StatusStrip()
        }
        .padding(16)
        .task {
            await appState.scanLocalModels()
        }
    }
}

private struct StartHerePanel: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .top, spacing: 10) {
                Image(systemName: "scope")
                    .font(.title3)
                    .foregroundStyle(Color.accentColor)
                VStack(alignment: .leading, spacing: 4) {
                    Text("Turn a strong prompt into reusable building blocks.")
                        .font(.headline)
                    Text("Start by pasting text. Run Experiment to preview. Run Learn when you want to save useful snippets locally.")
                        .font(.callout)
                        .foregroundStyle(.secondary)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }

            HStack(spacing: 8) {
                StepPill(number: "1", text: "Paste")
                StepPill(number: "2", text: "Experiment")
                StepPill(number: "3", text: "Review")
                StepPill(number: "4", text: "Learn")
                Spacer()
                Button {
                    appState.loadSamplePrompt()
                } label: {
                    Label("Try Sample", systemImage: "play")
                }
                .controlSize(.small)
            }
        }
        .padding(12)
        .background(LabColor.panel)
        .clipShape(RoundedRectangle(cornerRadius: 8))
    }
}

private struct StepPill: View {
    let number: String
    let text: String

    var body: some View {
        HStack(spacing: 5) {
            Text(number)
                .font(.caption2.weight(.bold))
                .foregroundStyle(.white)
                .frame(width: 17, height: 17)
                .background(Color.accentColor)
                .clipShape(Circle())
            Text(text)
                .font(.caption.weight(.medium))
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 5)
        .background(Color(nsColor: .textBackgroundColor))
        .clipShape(Capsule())
    }
}

private struct ResultsColumn: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            RunBar()

            ViewSwitcher()

            ResultsBody()
                .frame(maxHeight: .infinity)

            SnippetInspector()
        }
        .padding(16)
    }
}

private struct ViewSwitcher: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        Picker("View", selection: $appState.selectedSidebar) {
            ForEach(SidebarSection.allCases) { section in
                Label(section.rawValue, systemImage: icon(for: section)).tag(section)
            }
        }
        .pickerStyle(.segmented)
        .help("Review is the main queue. Other views are for deeper inspection.")
    }

    private func icon(for section: SidebarSection) -> String {
        switch section {
        case .concepts: "tag"
        case .intents: "arrow.triangle.branch"
        case .ontology: "point.3.connected.trianglepath.dotted"
        case .rejected: "exclamationmark.triangle"
        }
    }
}

private struct RunBar: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 3) {
                Text("Lens")
                    .font(.title3.weight(.semibold))
                Text(appState.report == nil ? "Choose an engine, then run Experiment." : appState.status)
                    .font(.caption)
                    .foregroundStyle(appState.errorMessage == nil ? .secondary : LabColor.rejection)
                    .lineLimit(2)
            }

            Spacer()

            EngineDisclosure()

            Button {
                Task { await appState.run(.experiment) }
            } label: {
                Label("Experiment", systemImage: "flask")
            }
            .disabled(appState.isRunning)

            Button {
                Task { await appState.run(.learn) }
            } label: {
                Label("Learn", systemImage: "plus.square.on.square")
            }
            .keyboardShortcut(.return, modifiers: [.command])
            .buttonStyle(.borderedProminent)
            .disabled(appState.isRunning)
        }
    }
}

private struct EngineDisclosure: View {
    @EnvironmentObject private var appState: AppState
    @State private var isExpanded = false

    var body: some View {
        DisclosureGroup(isExpanded: $isExpanded) {
            Picker("Engine", selection: $appState.selectedEngine) {
                ForEach(EngineChoice.allCases) { engine in
                    Text(engine.label).tag(engine)
                }
            }
            .pickerStyle(.segmented)
            .frame(width: 250)
            .padding(.top, 6)
        } label: {
            HStack(spacing: 6) {
                Image(systemName: "cpu")
                Text(appState.selectedEngine == .heuristic ? "Local fast mode" : appState.selectedEngine.label)
            }
            .font(.caption.weight(.medium))
            .foregroundStyle(.secondary)
        }
        .frame(width: isExpanded ? 285 : 142, alignment: .leading)
    }
}

private struct ResultsBody: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        Group {
            if appState.report == nil {
                EmptyResultsView()
            } else {
                switch appState.selectedSidebar {
                case .concepts:
                    ReviewQueue(results: appState.report?.kept ?? [])
                case .intents:
                    IntentSnippetList(results: appState.intentResults)
                case .ontology:
                    OntologyView(results: appState.report?.kept ?? [])
                case .rejected:
                    RejectionList(results: appState.report?.rejected ?? [], dropped: appState.report?.dropped ?? [])
                }
            }
        }
    }
}

private struct ReviewQueue: View {
    let results: [KeptResult]

    var sorted: [KeptResult] {
        results.sorted { lhs, rhs in
            if lhs.score.score != rhs.score.score { return lhs.score.score > rhs.score.score }
            if lhs.snippet.kind != rhs.snippet.kind { return lhs.snippet.kind == .intent }
            return lhs.snippet.gloss < rhs.snippet.gloss
        }
    }

    var body: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: 8) {
                ForEach(sorted) { result in
                    ReviewRow(result: result)
                }
            }
        }
    }
}

private struct ReviewRow: View {
    @EnvironmentObject private var appState: AppState
    let result: KeptResult

    var body: some View {
        Button {
            appState.selectedSnippetID = result.snippet.id
        } label: {
            HStack(alignment: .top, spacing: 10) {
                Image(systemName: result.snippet.kind == .intent ? "arrow.triangle.branch" : "tag")
                    .foregroundStyle(result.snippet.kind == .intent ? LabColor.intent : LabColor.concept)
                    .frame(width: 20)
                VStack(alignment: .leading, spacing: 6) {
                    Text(result.snippet.gloss)
                        .font(.body.weight(.medium))
                        .multilineTextAlignment(.leading)
                    HStack {
                        Text(result.snippet.kind == .intent ? "reasoning move" : "concept")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        if let move = result.snippet.move {
                            Text(move)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        RelationBadge(relation: result.placement.relation)
                        Spacer()
                        ScoreLabel(score: result.score.score)
                    }
                }
            }
            .padding(10)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(LabColor.panel)
            .clipShape(RoundedRectangle(cornerRadius: 8))
        }
        .buttonStyle(.plain)
    }
}

private struct EmptyResultsView: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            Label("Start with Experiment", systemImage: "sparkles")
                .font(.title3.weight(.semibold))

            VStack(alignment: .leading, spacing: 8) {
                Label("Paste text on the left.", systemImage: "1.circle")
                Label("Click Experiment. Nothing is saved.", systemImage: "2.circle")
                Label("Review the useful building blocks here.", systemImage: "3.circle")
                Label("Click Learn only when the result is worth keeping.", systemImage: "4.circle")
            }
            .foregroundStyle(.secondary)
        }
        .padding(18)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .background(LabColor.panel.opacity(0.55))
        .clipShape(RoundedRectangle(cornerRadius: 8))
    }
}

private struct LocalModelPanel: View {
    @EnvironmentObject private var appState: AppState
    @State private var isExpanded = false

    private var sortedModels: [LocalModelCandidate] {
        appState.localModels.sorted { lhs, rhs in
            if lhs.runnable != rhs.runnable { return lhs.runnable && !rhs.runnable }
            if lhs.generative != rhs.generative { return lhs.generative && !rhs.generative }
            return lhs.name < rhs.name
        }
    }

    var body: some View {
        LabSection(title: "Runtime") {
            HStack(spacing: 10) {
                Image(systemName: runtimeIcon)
                    .foregroundStyle(runtimeColor)
                Text(appState.modelStatus)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(2)
                Spacer()
                Button {
                    Task { await appState.scanLocalModels() }
                } label: {
                    Label("Scan", systemImage: "magnifyingglass")
                }
                .controlSize(.small)
            }

            if let runtime = appState.mlxRuntime, let error = runtime.error, !runtime.usable {
                if appState.showAdvancedRuntime {
                    Text(error)
                        .font(.caption)
                        .foregroundStyle(LabColor.rejection)
                        .lineLimit(isExpanded ? 4 : 1)
                        .textSelection(.enabled)
                }
            }

            Toggle("Show model details", isOn: $appState.showAdvancedRuntime)
                .font(.caption)

            if appState.showAdvancedRuntime && !appState.localModels.isEmpty {
                DisclosureGroup(isExpanded: $isExpanded) {
                    VStack(alignment: .leading, spacing: 6) {
                        ForEach(sortedModels.prefix(isExpanded ? 12 : 3)) { model in
                            LocalModelRow(model: model)
                        }
                        if sortedModels.count > (isExpanded ? 12 : 3) {
                            Text("+ \(sortedModels.count - (isExpanded ? 12 : 3)) more")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }
                    .padding(.top, 4)
                } label: {
                    Text("Model candidates")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
        }
    }

    private var runtimeIcon: String {
        guard let runtime = appState.mlxRuntime else { return "circle.dotted" }
        if runtime.usable { return "checkmark.circle" }
        if runtime.commandFound { return "exclamationmark.triangle" }
        return "xmark.circle"
    }

    private var runtimeColor: Color {
        guard let runtime = appState.mlxRuntime else { return .secondary }
        if runtime.usable { return .green }
        if runtime.commandFound { return .orange }
        return LabColor.rejection
    }
}

private struct LocalModelRow: View {
    let model: LocalModelCandidate

    var body: some View {
        HStack(alignment: .firstTextBaseline) {
            Text(model.provider)
                .font(.caption.monospaced())
                .foregroundStyle(.secondary)
                .frame(width: 82, alignment: .leading)
            VStack(alignment: .leading, spacing: 2) {
                HStack {
                    Text(model.name)
                        .lineLimit(1)
                    if model.runnable {
                        Text("runnable")
                            .font(.caption2)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Color.green.opacity(0.16))
                            .clipShape(Capsule())
                    }
                    if !model.generative {
                        Text("not generative")
                            .font(.caption2)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Color.orange.opacity(0.16))
                            .clipShape(Capsule())
                    }
                }
                Text(model.note)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(2)
            }
        }
    }
}

private struct StatusStrip: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        HStack(spacing: 10) {
            if appState.isRunning {
                ProgressView()
                    .controlSize(.small)
            }
            Text(appState.selectedEngine.label)
                .font(.caption.monospaced())
                .foregroundStyle(.secondary)
            Spacer()
            Text("local-first")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
    }
}
