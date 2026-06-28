import SwiftUI

struct ConceptSnippetList: View {
    let results: [KeptResult]

    var body: some View {
        ScrollView {
            LazyVGrid(columns: [GridItem(.adaptive(minimum: 150), spacing: 8)], alignment: .leading, spacing: 8) {
                ForEach(results) { result in
                    ConceptChip(result: result)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}

private struct ConceptChip: View {
    @EnvironmentObject private var appState: AppState
    let result: KeptResult

    var body: some View {
        Button {
            appState.selectedSnippetID = result.snippet.id
        } label: {
            VStack(alignment: .leading, spacing: 6) {
                Text(result.snippet.gloss)
                    .font(.callout.weight(.medium))
                    .lineLimit(2)
                    .multilineTextAlignment(.leading)
                HStack {
                    RelationBadge(relation: result.placement.relation)
                    Spacer()
                    ScoreLabel(score: result.score.score)
                }
            }
            .padding(10)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(LabColor.concept.opacity(appState.selectedSnippetID == result.snippet.id ? 0.22 : 0.12))
            .clipShape(RoundedRectangle(cornerRadius: 8))
        }
        .buttonStyle(.plain)
    }
}

struct IntentSnippetList: View {
    let results: [KeptResult]

    var body: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: 8) {
                ForEach(results) { result in
                    IntentRow(result: result)
                }
            }
        }
    }
}

private struct IntentRow: View {
    @EnvironmentObject private var appState: AppState
    let result: KeptResult

    var body: some View {
        Button {
            appState.selectedSnippetID = result.snippet.id
        } label: {
            VStack(alignment: .leading, spacing: 8) {
                Text(result.snippet.gloss)
                    .font(.body)
                    .multilineTextAlignment(.leading)
                HStack {
                    if let move = result.snippet.move {
                        Label(move, systemImage: "arrow.triangle.branch")
                            .font(.caption)
                    }
                    RelationBadge(relation: result.placement.relation)
                    Spacer()
                    ScoreLabel(score: result.score.score)
                }
                .foregroundStyle(.secondary)
            }
            .padding(10)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(LabColor.intent.opacity(appState.selectedSnippetID == result.snippet.id ? 0.20 : 0.10))
            .clipShape(RoundedRectangle(cornerRadius: 8))
        }
        .buttonStyle(.plain)
    }
}

struct SnippetInspector: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        LabSection(title: "Inspector") {
            if let selected = selectedResult {
                VStack(alignment: .leading, spacing: 8) {
                    Text(selected.snippet.gloss)
                        .font(.body.weight(.medium))
                    Text(selected.score.why)
                        .foregroundStyle(.secondary)
                    HStack {
                        RelationBadge(relation: selected.placement.relation)
                        ScoreLabel(score: selected.score.score)
                        Spacer()
                        Button {
                            Task { await appState.contributeSelectedSnippet() }
                        } label: {
                            Label("Contribute", systemImage: "square.and.arrow.up")
                        }
                        .disabled(appState.isRunning)
                    }
                    if let sharePreview = appState.sharePreview {
                        Divider()
                        Text(sharePreview)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                            .textSelection(.enabled)
                    }
                }
            } else {
                Text("Select a snippet to inspect placement, score, and contribution readiness.")
                    .foregroundStyle(.secondary)
            }
        }
    }

    private var selectedResult: KeptResult? {
        guard let id = appState.selectedSnippetID else { return nil }
        return appState.report?.kept.first(where: { $0.snippet.id == id })
    }
}
