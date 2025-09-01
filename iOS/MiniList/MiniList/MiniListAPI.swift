//
//  MiniListAPI.swift
//  MiniList
//
//  Created by Jacob Chin on 9/1/25.
//

import Foundation

struct APITask: Identifiable, Codable {
    let id: String
    let title: String
    var done: Bool
    // we don't need due for the widget, server already filters to "today"
}

enum MiniListAPI {
    static let base = URL(string: "https://YOUR-MINILIST-DOMAIN/api")! // <-- CHANGE THIS

    static func todayString() -> String {
        var cal = Calendar.current
        cal.timeZone = .current
        let comps = cal.dateComponents([.year, .month, .day], from: Date())
        let d = cal.date(from: comps)!
        let f = DateFormatter()
        f.calendar = cal
        f.timeZone = .current
        f.dateFormat = "yyyy-MM-dd"
        return f.string(from: d)
    }

    static func fetchTodayTasks() async throws -> [APITask] {
        var url = base.appendingPathComponent("tasks")
        var comps = URLComponents(url: url, resolvingAgainstBaseURL: false)!
        comps.queryItems = [URLQueryItem(name: "date", value: todayString())]
        url = comps.url!

        let (data, resp) = try await URLSession.shared.data(from: url)
        guard (resp as? HTTPURLResponse)?.statusCode == 200 else { return [] }
        // API returns { tasks: Task[] }
        struct Payload: Decodable { let tasks: [APITask] }
        let payload = try JSONDecoder().decode(Payload.self, from: data)
        return payload.tasks
    }

    static func toggleTask(id: String, currentlyDone: Bool) async {
        var req = URLRequest(url: base.appendingPathComponent("tasks"))
        req.httpMethod = "PATCH"
        req.addValue("application/json", forHTTPHeaderField: "Content-Type")
        let body = ["id": id, "done": !currentlyDone] as [String : Any]
        req.httpBody = try? JSONSerialization.data(withJSONObject: body)

        _ = try? await URLSession.shared.data(for: req)
    }
}

