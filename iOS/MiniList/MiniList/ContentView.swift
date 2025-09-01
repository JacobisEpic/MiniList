//
//  ContentView.swift
//  MiniList
//
//  Created by Jacob Chin on 9/1/25.
//

import SwiftUI

struct ContentView: View {
    var body: some View {
        NavigationStack {
            VStack(spacing: 8) {
                Text("MiniList")
                    .font(.title).bold()
                Text("The widget shows today’s tasks.\nYou can keep this app empty.")
                    .multilineTextAlignment(.center)
                    .foregroundStyle(.secondary)
            }
            .padding()
            .navigationTitle("MiniList")
        }
    }
}
