package com.didit.server.data.repository;

import com.didit.server.data.entity.ProjectEntity;
import com.didit.server.data.entity.UserGithubAuthEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserGithubAuthRepository extends JpaRepository<UserGithubAuthEntity, Long> {
}
