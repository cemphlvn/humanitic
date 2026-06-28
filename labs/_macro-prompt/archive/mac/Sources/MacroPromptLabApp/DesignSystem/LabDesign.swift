import SwiftUI

enum LabColor {
    static let background = Color(nsColor: .windowBackgroundColor)
    static let panel = Color(nsColor: .controlBackgroundColor)
    static let subtle = Color(nsColor: .secondaryLabelColor)
    static let border = Color(nsColor: .separatorColor)
    static let concept = Color(red: 0.13, green: 0.43, blue: 0.38)
    static let intent = Color(red: 0.28, green: 0.32, blue: 0.58)
    static let rejection = Color(red: 0.58, green: 0.18, blue: 0.16)
}

struct LabSection<Content: View>: View {
    let title: String
    @ViewBuilder let content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(title)
                .font(.headline)
            content
        }
        .padding(12)
        .background(LabColor.panel)
        .clipShape(RoundedRectangle(cornerRadius: 8))
    }
}

struct RelationBadge: View {
    let relation: String

    var body: some View {
        Text(relation)
            .font(.caption)
            .padding(.horizontal, 8)
            .padding(.vertical, 3)
            .background(Color.accentColor.opacity(0.14))
            .clipShape(Capsule())
    }
}

struct ScoreLabel: View {
    let score: Double

    var body: some View {
        Text(score, format: .number.precision(.fractionLength(2)))
            .font(.caption.monospacedDigit())
            .foregroundStyle(.secondary)
    }
}
