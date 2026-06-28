// swift-tools-version: 6.0

import PackageDescription

let package = Package(
    name: "MacroPromptLab",
    platforms: [.macOS(.v14)],
    products: [
        .executable(name: "MacroPromptLab", targets: ["MacroPromptLabApp"])
    ],
    targets: [
        .executableTarget(
            name: "MacroPromptLabApp",
            path: "Sources/MacroPromptLabApp"
        )
    ]
)
