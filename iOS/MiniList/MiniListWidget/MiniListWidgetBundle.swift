//
//  MiniListWidgetBundle.swift
//  MiniListWidget
//
//  Created by Jacob Chin on 9/1/25.
//

import WidgetKit
import SwiftUI

@main
struct MiniListWidgetBundle: WidgetBundle {
    var body: some Widget {
        MiniListWidget()
        MiniListWidgetControl()
        MiniListWidgetLiveActivity()
    }
}
