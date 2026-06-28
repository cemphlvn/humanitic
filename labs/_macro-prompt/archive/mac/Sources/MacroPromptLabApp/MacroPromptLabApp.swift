import SwiftUI

@main
struct MacroPromptLabApp: App {
    @StateObject private var appState = AppState()

    var body: some Scene {
        WindowGroup {
            WorkspaceView()
                .environmentObject(appState)
                .frame(minWidth: 1120, minHeight: 720)
        }
        .commands {
            CommandGroup(after: .newItem) {
                Button("Run Experiment") {
                    Task { await appState.run(.experiment) }
                }
                .keyboardShortcut("r", modifiers: [.command])

                Button("Learn") {
                    Task { await appState.run(.learn) }
                }
                .keyboardShortcut("l", modifiers: [.command])
            }
        }
    }
}
