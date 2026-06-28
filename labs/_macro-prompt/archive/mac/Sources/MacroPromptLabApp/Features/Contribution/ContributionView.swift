import SwiftUI

struct ContributionConsentNote: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Contribution is opt-in", systemImage: "lock.shield")
                .font(.headline)
            Text("The share composer receives only the selected snippet and returns a de-identified pattern. Raw pasted prompts remain local.")
                .foregroundStyle(.secondary)
        }
        .padding(12)
        .background(LabColor.panel)
        .clipShape(RoundedRectangle(cornerRadius: 8))
    }
}
