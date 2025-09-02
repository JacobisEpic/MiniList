//
//  MiniListAPI.swift
//  MiniList
//
//  Created by Jacob Chin on 9/1/25.
//

import Foundation

enum MiniListAPI {
    static let base = URL(string: "")!

    static func todayString() -> String {
        let cal = Calendar.current
        let start = cal.startOfDay(for: Date())
        let f = DateFormatter()
        f.calendar = cal
        f.timeZone = .current
        f.dateFormat = "yyyy-MM-dd"
        return f.string(from: start)
    }

    static func fetchTodayTasks() async throws -> [APITask] {
        var comps = URLComponents(url: base.appendingPathComponent("tasks"),
                                  resolvingAgainstBaseURL: false)!
        comps.queryItems = [URLQueryItem(name: "date", value: todayString())]
        let url = comps.url!

        let (data, resp) = try await URLSession.shared.data(from: url)
        guard (resp as? HTTPURLResponse)?.statusCode == 200 else { return [] }

        struct Payload: Decodable { let tasks: [APITask] }
        return try JSONDecoder().decode(Payload.self, from: data).tasks
    }

    static func toggleTask(id: String, currentlyDone: Bool) async {
        var req = URLRequest(url: base.appendingPathComponent("tasks"))
        req.httpMethod = "PATCH"
        req.addValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpBody = try? JSONSerialization.data(withJSONObject: [
            "id": id,
            "done": !currentlyDone
        ])
        _ = try? await URLSession.shared.data(for: req)
    }
}
