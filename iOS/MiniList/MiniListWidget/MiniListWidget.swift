//
//  MiniListWidget.swift
//  MiniListWidget
//
//  Created by Jacob Chin on 9/1/25.
//

import WidgetKit
import SwiftUI
import AppIntents
import os

// MARK: - Entry

struct MiniListEntry: TimelineEntry {
    let date: Date
    let tasks: [APITask]
}

// MARK: - Provider

private let log = Logger(subsystem: "MiniListWidget", category: "Timeline")

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> MiniListEntry {
        // Shown in the widget gallery / while loading
        MiniListEntry(date: Date(), tasks: [
            APITask(id: "1", title: "Write YouTube video script", done: false),
            APITask(id: "2", title: "Write blog post", done: false),
            APITask(id: "3", title: "Record interactive demo", done: false),
            APITask(id: "4", title: "Create a Notion template", done: true),
        ])
    }

    func getSnapshot(in context: Context, completion: @escaping (MiniListEntry) -> Void) {
        // Keep snapshots instant & reliable (gallery/first add). Real data can load in timeline.
        completion(placeholder(in: context))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<MiniListEntry>) -> Void) {
        Task {
            // Fetch today’s tasks from your Next.js API on Vercel
            let fetched = (try? await MiniListAPI.fetchTodayTasks()) ?? []
            log.debug("Fetched \(fetched.count) tasks for timeline")

            // Let the view decide how to show "no tasks" (don’t inject demo here)
            let entry = MiniListEntry(date: Date(), tasks: fetched)

            completion(Timeline(
                entries: [entry],
                policy: .after(Date().addingTimeInterval(15 * 60)) // refresh ~15m
            ))
        }
    }
}

// MARK: - View

struct MiniListWidgetEntryView: View {
    var entry: Provider.Entry

    var body: some View {
        let items = Array(entry.tasks.prefix(6))

        VStack(alignment: .leading, spacing: 4) {
            if items.isEmpty {
                Text("No tasks today")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(.secondary)
            } else {
                ForEach(items, id: \.id) { task in
                    let weight: Font.Weight = task.done ? .regular : .semibold
                    let color: Color = task.done ? .gray : .primary
                    Button(intent: ToggleTaskIntent(taskId: task.id, done: task.done)) {
                        Text(task.title)
                            .font(.system(size: 14, weight: weight))
                            .foregroundStyle(color)
                            .strikethrough(task.done, color: .gray)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }
                    .buttonStyle(.plain)
                }
            }
            Spacer(minLength: 0)
        }
        .padding(12)
        .containerBackground(.background, for: .widget)
    }
}

// MARK: - Widget

struct MiniListWidget: Widget {
    let kind = "MiniListWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            MiniListWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("MiniList")
        .description("See and toggle today’s tasks.")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}

// MARK: - Preview

#if DEBUG
#Preview(as: .systemSmall) {
    MiniListWidget()
} timeline: {
    MiniListEntry(date: .init(), tasks: [
        APITask(id: "1", title: "Write blog post", done: false),
        APITask(id: "2", title: "Create a Notion template", done: true),
    ])
}
#endif
