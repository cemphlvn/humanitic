import SwiftUI

struct OntologyView: View {
    let results: [KeptResult]

    var body: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: 8) {
                ForEach(results) { result in
                    OntologyRow(result: result)
                }
            }
        }
    }
}

private struct OntologyRow: View {
    let result: KeptResult

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(result.snippet.kind.rawValue)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Text(result.snippet.gloss)
                    .font(.body.weight(.medium))
                Spacer()
                RelationBadge(relation: result.placement.relation)
            }

            HStack {
                Text("nearest")
                    .foregroundStyle(.secondary)
                Text(result.placement.nearestId ?? "none")
                    .font(.caption.monospaced())
                Spacer()
                ScoreLabel(score: result.placement.nearestScore)
            }
            .font(.caption)

            if !result.placement.neighbors.isEmpty {
                VStack(alignment: .leading, spacing: 4) {
                    ForEach(result.placement.neighbors) { neighbor in
                        HStack {
                            Text(neighbor.id)
                                .font(.caption.monospaced())
                            Spacer()
                            ScoreLabel(score: neighbor.score)
                        }
                    }
                }
            }
        }
        .padding(10)
        .background(LabColor.panel)
        .clipShape(RoundedRectangle(cornerRadius: 8))
    }
}
