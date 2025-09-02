//
//  ToggleTaskIntent.swift
//  MiniList
//
//  Created by Jacob Chin on 9/1/25.
//

import AppIntents
import WidgetKit

@available(iOS 17.0, *)
struct ToggleTaskIntent: AppIntent {
    static var title: LocalizedStringResource = "Toggle Task"
    static var description = IntentDescription("Toggle a MiniList task in Notion")

    @Parameter(title: "Task ID") var taskId: String
    @Parameter(title: "Currently Done") var done: Bool

    init() {}

    init(taskId: String, done: Bool) {
        self.taskId = taskId
        self.done = done
    }

    func perform() async throws -> some IntentResult {
        await MiniListAPI.toggleTask(id: taskId, currentlyDone: done)
        WidgetCenter.shared.reloadTimelines(ofKind: "MiniListWidget")
        return .result()
    }
}
