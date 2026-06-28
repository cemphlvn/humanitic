import Foundation

enum LoopRunnerError: LocalizedError {
    case repoRootNotFound
    case invalidOutput(String)
    case commandFailed(status: Int32, output: String)

    var errorDescription: String? {
        switch self {
        case .repoRootNotFound:
            "Could not find repo root containing src/cli.ts."
        case .invalidOutput(let output):
            "Could not decode loop output: \(output)"
        case .commandFailed(let status, let output):
            "Loop command failed with status \(status): \(output)"
        }
    }
}

actor LoopRunner {
    private let decoder = JSONDecoder()

    func run(command: String, text: String, engine: String) async throws -> LoopReport {
        let root = try repoRoot()
        let cli = root.appendingPathComponent("src/cli.ts").path
        let output = try await execute(
            currentDirectory: root,
            arguments: ["node", cli, command, "--text", text, "--engine", engine, "--json"]
        )
        guard let data = extractJSONObject(from: output).data(using: .utf8) else {
            throw LoopRunnerError.invalidOutput(output)
        }
        do {
            return try decoder.decode(LoopReport.self, from: data)
        } catch {
            throw LoopRunnerError.invalidOutput(output)
        }
    }

    func contribute(id: String) async throws -> String {
        let root = try repoRoot()
        let cli = root.appendingPathComponent("src/cli.ts").path
        return try await execute(
            currentDirectory: root,
            arguments: ["node", cli, "contribute", id]
        )
    }

    func localModels() async throws -> LocalModelsReport {
        let root = try repoRoot()
        let cli = root.appendingPathComponent("src/cli.ts").path
        let output = try await execute(
            currentDirectory: root,
            arguments: ["node", cli, "models", "--json"]
        )
        guard let data = extractJSONObject(from: output).data(using: .utf8) else {
            throw LoopRunnerError.invalidOutput(output)
        }
        do {
            return try decoder.decode(LocalModelsReport.self, from: data)
        } catch {
            throw LoopRunnerError.invalidOutput(output)
        }
    }

    private func execute(currentDirectory: URL, arguments: [String]) async throws -> String {
        try await Task.detached {
            let process = Process()
            process.executableURL = URL(fileURLWithPath: "/usr/bin/env")
            process.arguments = arguments
            process.currentDirectoryURL = currentDirectory

            let pipe = Pipe()
            process.standardOutput = pipe
            process.standardError = pipe

            try process.run()
            process.waitUntilExit()

            let data = pipe.fileHandleForReading.readDataToEndOfFile()
            let output = String(data: data, encoding: .utf8) ?? ""
            guard process.terminationStatus == 0 else {
                throw LoopRunnerError.commandFailed(status: process.terminationStatus, output: output)
            }
            return output
        }.value
    }

    private func repoRoot() throws -> URL {
        var url = URL(fileURLWithPath: #filePath)
        while url.path != "/" {
            let candidate = url.appendingPathComponent("src/cli.ts")
            if FileManager.default.fileExists(atPath: candidate.path) {
                return url
            }
            url.deleteLastPathComponent()
        }
        throw LoopRunnerError.repoRootNotFound
    }

    private func extractJSONObject(from output: String) -> String {
        let trimmed = output.trimmingCharacters(in: .whitespacesAndNewlines)
        guard let start = trimmed.firstIndex(of: "{"), let end = trimmed.lastIndex(of: "}") else {
            return trimmed
        }
        return String(trimmed[start...end])
    }
}
