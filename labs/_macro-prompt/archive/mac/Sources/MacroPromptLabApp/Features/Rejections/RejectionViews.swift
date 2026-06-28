import SwiftUI

struct RejectionList: View {
    let results: [RejectedResult]
    let dropped: [DroppedResult]

    var body: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: 10) {
                if results.isEmpty && dropped.isEmpty {
                    Text("No rejected or dropped results for the current run.")
                        .foregroundStyle(.secondary)
                }

                ForEach(results) { result in
                    VStack(alignment: .leading, spacing: 8) {
                        Label(result.verdict.failedAssumption ?? "Rejected", systemImage: "exclamationmark.triangle")
                            .font(.callout.weight(.semibold))
                            .foregroundStyle(LabColor.rejection)
                        Text(result.verdict.reason)
                            .foregroundStyle(.secondary)
                        Text(result.fragment)
                            .font(.caption)
                            .textSelection(.enabled)
                    }
                    .padding(10)
                    .background(LabColor.rejection.opacity(0.08))
                    .clipShape(RoundedRectangle(cornerRadius: 8))
                }

                ForEach(dropped) { result in
                    VStack(alignment: .leading, spacing: 8) {
                        Label("Dropped snippet", systemImage: "minus.circle")
                            .font(.callout.weight(.semibold))
                        Text(result.snippet.gloss)
                        Text(result.score.why)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    .padding(10)
                    .background(LabColor.panel)
                    .clipShape(RoundedRectangle(cornerRadius: 8))
                }
            }
        }
    }
}
