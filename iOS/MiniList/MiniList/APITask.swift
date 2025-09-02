//
//  APITask.swift
//  MiniList
//
//  Created by Jacob Chin on 9/1/25.
//

import Foundation

struct APITask: Codable, Identifiable, Hashable {
    let id: String
    let title: String
    var done: Bool
}
