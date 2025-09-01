//
//  MiniListWidgetLiveActivity.swift
//  MiniListWidget
//
//  Created by Jacob Chin on 9/1/25.
//

import ActivityKit
import WidgetKit
import SwiftUI

struct MiniListWidgetAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        // Dynamic stateful properties about your activity go here!
        var emoji: String
    }

    // Fixed non-changing properties about your activity go here!
    var name: String
}

struct MiniListWidgetLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: MiniListWidgetAttributes.self) { context in
            // Lock screen/banner UI goes here
            VStack {
                Text("Hello \(context.state.emoji)")
            }
            .activityBackgroundTint(Color.cyan)
            .activitySystemActionForegroundColor(Color.black)

        } dynamicIsland: { context in
            DynamicIsland {
                // Expanded UI goes here.  Compose the expanded UI through
                // various regions, like leading/trailing/center/bottom
                DynamicIslandExpandedRegion(.leading) {
                    Text("Leading")
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text("Trailing")
                }
                DynamicIslandExpandedRegion(.bottom) {
                    Text("Bottom \(context.state.emoji)")
                    // more content
                }
            } compactLeading: {
                Text("L")
            } compactTrailing: {
                Text("T \(context.state.emoji)")
            } minimal: {
                Text(context.state.emoji)
            }
            .widgetURL(URL(string: "http://www.apple.com"))
            .keylineTint(Color.red)
        }
    }
}

extension MiniListWidgetAttributes {
    fileprivate static var preview: MiniListWidgetAttributes {
        MiniListWidgetAttributes(name: "World")
    }
}

extension MiniListWidgetAttributes.ContentState {
    fileprivate static var smiley: MiniListWidgetAttributes.ContentState {
        MiniListWidgetAttributes.ContentState(emoji: "😀")
     }
     
     fileprivate static var starEyes: MiniListWidgetAttributes.ContentState {
         MiniListWidgetAttributes.ContentState(emoji: "🤩")
     }
}

#Preview("Notification", as: .content, using: MiniListWidgetAttributes.preview) {
   MiniListWidgetLiveActivity()
} contentStates: {
    MiniListWidgetAttributes.ContentState.smiley
    MiniListWidgetAttributes.ContentState.starEyes
}
